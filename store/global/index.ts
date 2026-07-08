import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { API, ApiError } from "@/lib/api";
import { STORAGE_KEYS } from "@/lib/constants";
import i18n, { applyLanguage, type AppLanguage } from "@/lib/i18n";
import { notify } from "@/lib/notify";
import { routerLinks } from "@/lib/router-links";
import {
    bootstrapToken,
    clearAuthStorage,
    getAuthTokenSync,
    getBiometricEnabled,
    getUser,
    setAuthTokens,
    setUser,
} from "@/lib/secure-storage";
import type { Gender } from "@/models/enums";
import { useAppDispatch, useTypedSelector } from "@/store/hooks";
import type {
    AttachmentViewModel,
    UserProfileUpdateModel,
    UserViewModel,
} from "@/store/user/model";
import type { ThemePreference } from "@/theme/themes";

const AUTH = routerLinks("Auth");
const USER = routerLinks("User");

export interface Auth {
  userId?: string;
  userModel?: UserViewModel;
  tokenString?: string;
  refreshToken?: string;
  issuedAt?: string;
  expiresAt?: string;
  roleListCode?: string[];
  rights?: string[];
}

export interface LoginModel {
  identifier: string;
  password: string;
  rememberMe?: boolean;
  deviceToken?: string;
}

export interface SignUpModel {
  name: string;
  email: string;
  phoneNumber?: string;
  password: string;
  confirmPassword: string;
  gender?: Gender;
  roleListCode?: string[];
}

export interface ResetPasswordModel {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export enum EStatusGlobal {
  idle = "idle",
  bootstrapDone = "bootstrap.done",
  loginPending = "login.pending",
  loginFulfilled = "login.fulfilled",
  loginRejected = "login.rejected",
  registerPending = "register.pending",
  registerFulfilled = "register.fulfilled",
  registerRejected = "register.rejected",
  profileFulfilled = "profile.fulfilled",
  confirmEmailFulfilled = "confirmEmail.fulfilled",
  confirmEmailRejected = "confirmEmail.rejected",
  verifyEmailFulfilled = "verifyEmail.fulfilled",
  forgotPasswordFulfilled = "forgotPassword.fulfilled",
  resetPasswordFulfilled = "resetPassword.fulfilled",
  logoutFulfilled = "logout.fulfilled",
}

interface GlobalState {
  user: Auth | null;
  isAuthenticating: boolean;
  isSubmitting: boolean;
  status: EStatusGlobal | string;
  errorMessage?: string;
  /** last email used (register/forgot) so verify screens can prefill. */
  pendingEmail?: string;
  /** A saved session gated behind biometric unlock. */
  biometricLocked: boolean;
  pendingAuth: Auth | null;
  themeMode: ThemePreference;
}

const initialState: GlobalState = {
  user: null,
  isAuthenticating: true,
  isSubmitting: false,
  status: EStatusGlobal.idle,
  biometricLocked: false,
  pendingAuth: null,
  themeMode: "system",
};

// --- Thunks ----------------------------------------------------------------

/** Restore session from secure storage on app launch. */
export const bootstrap = createAsyncThunk("Auth/bootstrap", async () => {
  const [token, themeMode] = await Promise.all([
    bootstrapToken(),
    AsyncStorage.getItem(STORAGE_KEYS.themeMode),
  ]);
  if (!token) {
    return {
      auth: null,
      biometricEnabled: false,
      themeMode: (themeMode as ThemePreference | null) ?? "system",
    };
  }
  const userModel = await getUser();
  const biometricEnabled = await getBiometricEnabled();
  return {
    auth: { tokenString: token, userModel } as Auth,
    biometricEnabled,
    themeMode: (themeMode as ThemePreference | null) ?? "system",
  };
});

export const login = createAsyncThunk(
  "Auth/login",
  async (values: LoginModel, { rejectWithValue }) => {
    try {
      const res = await API.post<Auth>(`${AUTH}/jwt/login`, values);
      const data = res.data;
      if (data?.tokenString) {
        await setAuthTokens({
          tokenString: data.tokenString,
          refreshToken: data.refreshToken,
        });
        if (data.userModel) await setUser(data.userModel);
      }
      if (res.message) notify.success(res.message);
      return data ?? null;
    } catch (e) {
      const err = e as ApiError;
      return rejectWithValue({ message: err.message, status: err.status });
    }
  },
);

export const register = createAsyncThunk(
  "Auth/register",
  async (values: SignUpModel, { rejectWithValue }) => {
    try {
      const res = await API.post<UserViewModel>(`${AUTH}/register`, {
        ...values,
        roleListCode: values.roleListCode ?? ["USER"],
      });
      if (res.message) notify.success(res.message);
      return { data: res.data, email: values.email };
    } catch (e) {
      return rejectWithValue((e as ApiError).message);
    }
  },
);

export const confirmEmail = createAsyncThunk(
  "Auth/confirmEmail",
  async (values: { email: string; token: string }, { rejectWithValue }) => {
    try {
      const res = await API.post(`${AUTH}/email/confirm`, values);
      if (res.message) notify.success(res.message);
      return res;
    } catch (e) {
      return rejectWithValue((e as ApiError).message);
    }
  },
);

export const verifyEmail = createAsyncThunk(
  "Auth/verifyEmail",
  async (values: { email: string }, { rejectWithValue }) => {
    try {
      const res = await API.post(`${AUTH}/email/verify`, values);
      if (res.message) notify.success(res.message);
      return res;
    } catch (e) {
      return rejectWithValue((e as ApiError).message);
    }
  },
);

export const forgotPassword = createAsyncThunk(
  "Auth/forgotPassword",
  async (values: { email: string }, { rejectWithValue }) => {
    try {
      const res = await API.post(`${AUTH}/password/forgot`, values);
      if (res.message) notify.success(res.message);
      return { res, email: values.email };
    } catch (e) {
      return rejectWithValue((e as ApiError).message);
    }
  },
);

export const resetPassword = createAsyncThunk(
  "Auth/resetPassword",
  async (values: ResetPasswordModel, { rejectWithValue }) => {
    try {
      const res = await API.post(`${AUTH}/password/reset`, values);
      if (res.message) notify.success(res.message);
      return res;
    } catch (e) {
      return rejectWithValue((e as ApiError).message);
    }
  },
);

/** Refresh the current user from the server (also revalidates the session). */
export const profile = createAsyncThunk("Auth/profile", async () => {
  const res = await API.post<Auth>(`${AUTH}/jwt/info`);
  if (res.data?.userModel) await setUser(res.data.userModel);
  return res.data ?? null;
});

/** Update the current user's profile (name, phone, email, birthdate, gender). */
export const updateProfile = createAsyncThunk(
  "Auth/updateProfile",
  async (
    { id, values }: { id: string; values: UserProfileUpdateModel },
    { rejectWithValue },
  ) => {
    try {
      const res = await API.put<UserViewModel>(`${USER}/${id}/profile`, values);
      if (res.data) await setUser(res.data);
      if (res.message) notify.success(res.message);
      return res.data ?? null;
    } catch (e) {
      return rejectWithValue((e as ApiError).message);
    }
  },
);

/** Update the current user's avatar (attachment already uploaded to /upload/file). */
export const updateAvatar = createAsyncThunk(
  "Auth/updateAvatar",
  async (
    { id, attachment }: { id: string; attachment: AttachmentViewModel },
    { rejectWithValue },
  ) => {
    try {
      const res = await API.put<UserViewModel>(`${USER}/${id}/avatar`, attachment);
      if (res.data) await setUser(res.data);
      if (res.message) notify.success(res.message);
      return res.data ?? null;
    } catch (e) {
      return rejectWithValue((e as ApiError).message);
    }
  },
);

/** Switch the app language: apply locally, then persist to the server (best-effort) so
 * background jobs — budget alerts and the monthly summary email — use the chosen language.
 * The confirmation toast is fired from the fulfilled case below. */
export const changeLanguage = createAsyncThunk(
  "Auth/changeLanguage",
  async (lng: AppLanguage) => {
    await applyLanguage(lng);
    if (getAuthTokenSync()) {
      try {
        await API.put(`${USER}/language`, { language: lng });
      } catch {
        // best-effort; the header localizes live responses, jobs sync on next login
      }
    }
    return lng;
  },
);

export const logout = createAsyncThunk("Auth/logout", async () => {
  try {
    await API.post(`${AUTH}/logout`, {}, { isMobileDevice: "true" });
  } catch {
    // ignore network/logout errors — clear locally regardless
  }
  await clearAuthStorage();
});

// --- Slice -----------------------------------------------------------------

const slice = createSlice({
  name: "Auth",
  initialState,
  reducers: {
    set: (state, { payload }: PayloadAction<Partial<GlobalState>>) => {
      Object.assign(state, payload);
    },
    setThemeMode: (state, { payload }: PayloadAction<ThemePreference>) => {
      state.themeMode = payload;
    },
    updateUserModel: (state, { payload }: PayloadAction<UserViewModel>) => {
      if (state.user) state.user.userModel = payload;
    },
    unlockBiometric: (state) => {
      state.user = state.pendingAuth;
      state.pendingAuth = null;
      state.biometricLocked = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrap.pending, (s) => {
        s.isAuthenticating = true;
      })
      .addCase(bootstrap.fulfilled, (s, { payload }) => {
        s.isAuthenticating = false;
        s.status = EStatusGlobal.bootstrapDone;
        s.themeMode = payload.themeMode;
        if (payload.auth && payload.biometricEnabled) {
          s.pendingAuth = payload.auth;
          s.biometricLocked = true;
          s.user = null;
        } else {
          s.user = payload.auth;
          s.biometricLocked = false;
          s.pendingAuth = null;
        }
      })
      .addCase(bootstrap.rejected, (s) => {
        s.isAuthenticating = false;
        s.user = null;
        s.status = EStatusGlobal.bootstrapDone;
      })
      .addCase(login.pending, (s) => {
        s.isSubmitting = true;
        s.errorMessage = undefined;
        s.status = EStatusGlobal.loginPending;
      })
      .addCase(login.fulfilled, (s, { payload }) => {
        s.isSubmitting = false;
        s.user = payload;
        s.biometricLocked = false;
        s.pendingAuth = null;
        s.status = EStatusGlobal.loginFulfilled;
      })
      .addCase(login.rejected, (s, { payload }) => {
        s.isSubmitting = false;
        s.errorMessage = (payload as { message?: string })?.message;
        s.status = EStatusGlobal.loginRejected;
      })
      .addCase(register.pending, (s) => {
        s.isSubmitting = true;
        s.status = EStatusGlobal.registerPending;
      })
      .addCase(register.fulfilled, (s, { payload }) => {
        s.isSubmitting = false;
        s.pendingEmail = payload.email;
        s.status = EStatusGlobal.registerFulfilled;
      })
      .addCase(register.rejected, (s, { payload }) => {
        s.isSubmitting = false;
        s.errorMessage = payload as string;
        s.status = EStatusGlobal.registerRejected;
      })
      .addCase(confirmEmail.fulfilled, (s) => {
        s.status = EStatusGlobal.confirmEmailFulfilled;
      })
      .addCase(confirmEmail.rejected, (s, { payload }) => {
        s.errorMessage = payload as string;
        s.status = EStatusGlobal.confirmEmailRejected;
      })
      .addCase(verifyEmail.fulfilled, (s) => {
        s.status = EStatusGlobal.verifyEmailFulfilled;
      })
      .addCase(forgotPassword.fulfilled, (s, { payload }) => {
        s.pendingEmail = payload.email;
        s.status = EStatusGlobal.forgotPasswordFulfilled;
      })
      .addCase(resetPassword.fulfilled, (s) => {
        s.status = EStatusGlobal.resetPasswordFulfilled;
      })
      .addCase(profile.fulfilled, (s, { payload }) => {
        if (payload) s.user = payload;
        s.status = EStatusGlobal.profileFulfilled;
      })
      .addCase(updateProfile.pending, (s) => {
        s.isSubmitting = true;
        s.errorMessage = undefined;
      })
      .addCase(updateProfile.fulfilled, (s, { payload }) => {
        s.isSubmitting = false;
        if (payload && s.user) s.user.userModel = payload;
        s.status = EStatusGlobal.profileFulfilled;
      })
      .addCase(updateProfile.rejected, (s, { payload }) => {
        s.isSubmitting = false;
        s.errorMessage = payload as string;
      })
      .addCase(updateAvatar.fulfilled, (s, { payload }) => {
        if (payload && s.user) s.user.userModel = payload;
      })
      .addCase(changeLanguage.fulfilled, () => {
        // `t` resolves against the just-applied language.
        notify.success(i18n.t("settings.languageChanged"));
      })
      .addCase(logout.fulfilled, (s) => {
        s.user = null;
        s.biometricLocked = false;
        s.pendingAuth = null;
        s.status = EStatusGlobal.logoutFulfilled;
      });
  },
});

export const globalSlice = slice;

export const GlobalFacade = () => {
  const dispatch = useAppDispatch();
  const state = useTypedSelector((s) => s.global);
  return {
    ...state,
    isAuthenticated: !!state.user?.tokenString,
    login: (values: LoginModel) => dispatch(login(values)),
    register: (values: SignUpModel) => dispatch(register(values)),
    confirmEmail: (values: { email: string; token: string }) =>
      dispatch(confirmEmail(values)),
    verifyEmail: (email: string) => dispatch(verifyEmail({ email })),
    forgotPassword: (email: string) => dispatch(forgotPassword({ email })),
    resetPassword: (values: ResetPasswordModel) => dispatch(resetPassword(values)),
    profile: () => dispatch(profile()),
    updateProfile: (id: string, values: UserProfileUpdateModel) =>
      dispatch(updateProfile({ id, values })),
    updateAvatar: (id: string, attachment: AttachmentViewModel) =>
      dispatch(updateAvatar({ id, attachment })),
    changeLanguage: (lng: AppLanguage) => dispatch(changeLanguage(lng)),
    logout: () => dispatch(logout()),
    bootstrap: () => dispatch(bootstrap()),
    set: (payload: Partial<GlobalState>) => dispatch(slice.actions.set(payload)),
    setThemeMode: (mode: ThemePreference) => {
      dispatch(slice.actions.setThemeMode(mode));
      void AsyncStorage.setItem(STORAGE_KEYS.themeMode, mode);
    },
    updateUserModel: (u: UserViewModel) => dispatch(slice.actions.updateUserModel(u)),
    unlockBiometric: () => dispatch(slice.actions.unlockBiometric()),
  };
};
