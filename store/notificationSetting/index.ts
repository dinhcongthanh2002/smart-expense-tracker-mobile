import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { API, ApiError } from "@/lib/api";
import { useAppDispatch, useTypedSelector } from "@/store/hooks";
import type { NotificationSettingModel, NotificationSettingUpsert } from "./model";

const SETTINGS = "/settings";

export const notificationSettingGet = createAsyncThunk(
  "NotificationSetting/get",
  async (userId: string) => API.get<NotificationSettingModel>(`${SETTINGS}/${userId}`),
);

export const notificationSettingCreate = createAsyncThunk(
  "NotificationSetting/create",
  async ({ values }: { values: NotificationSettingUpsert }, { rejectWithValue }) => {
    try {
      return await API.post<NotificationSettingModel>(SETTINGS, values);
    } catch (e) {
      return rejectWithValue((e as ApiError).message);
    }
  },
);

export const notificationSettingUpdate = createAsyncThunk(
  "NotificationSetting/update",
  async (
    { id, values }: { id: string; values: NotificationSettingUpsert },
    { rejectWithValue },
  ) => {
    try {
      return await API.put<NotificationSettingModel>(`${SETTINGS}/${id}`, values);
    } catch (e) {
      return rejectWithValue((e as ApiError).message);
    }
  },
);

interface NotificationSettingState {
  data?: NotificationSettingModel | null;
  isLoading: boolean;
  isSubmitting: boolean;
}

const initialState: NotificationSettingState = { isLoading: false, isSubmitting: false };

const slice = createSlice({
  name: "NotificationSetting",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(notificationSettingGet.pending, (s) => {
        s.isLoading = true;
      })
      .addCase(notificationSettingGet.fulfilled, (s, { payload }) => {
        s.isLoading = false;
        s.data = payload.data ?? null;
      })
      .addCase(notificationSettingGet.rejected, (s) => {
        s.isLoading = false;
      })
      .addCase(notificationSettingCreate.fulfilled, (s, { payload }) => {
        s.data = payload.data ?? s.data;
      })
      .addCase(notificationSettingUpdate.fulfilled, (s, { payload }) => {
        s.data = payload.data ?? s.data;
      });
  },
});

export const notificationSettingSlice = slice;

export const NotificationSettingFacade = () => {
  const dispatch = useAppDispatch();
  const state = useTypedSelector((s) => s.notificationSetting);
  return {
    ...state,
    get: (userId: string) => dispatch(notificationSettingGet(userId)),
    // Create if the user has no setting row yet, otherwise update the existing one.
    save: (values: NotificationSettingUpsert) =>
      state.data?.id
        ? dispatch(notificationSettingUpdate({ id: state.data.id, values }))
        : dispatch(notificationSettingCreate({ values })),
  };
};
