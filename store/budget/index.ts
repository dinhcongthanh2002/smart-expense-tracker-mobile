import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { API, ApiError } from "@/lib/api";
import { routerLinks } from "@/lib/router-links";
import { notify } from "@/lib/notify";
import { useAppDispatch, useTypedSelector } from "@/store/hooks";
import type { Pagination, QueryParams } from "@/models/api.model";
import type {
  BudgetInviteViewModel,
  BudgetProgressViewModel,
  BudgetUpsertModel,
  BudgetViewModel,
} from "./model";

const BUDGET = routerLinks("Budget");

export const budgetGet = createAsyncThunk(
  "Budget/get",
  async (params: QueryParams = {}) =>
    API.get<Pagination<BudgetViewModel>>(BUDGET, { page: 1, size: 100, ...params }),
);

export const budgetGetProgress = createAsyncThunk(
  "Budget/progress",
  async (params: { month?: number; year?: number; categoryId?: string }) =>
    API.get<BudgetProgressViewModel[]>(`${BUDGET}/progress`, params),
);

export const budgetPost = createAsyncThunk(
  "Budget/post",
  async ({ values }: { values: BudgetUpsertModel }, { rejectWithValue }) => {
    try {
      const res = await API.post<BudgetViewModel>(BUDGET, values);
      if (res.message) notify.success(res.message);
      return res;
    } catch (e) {
      return rejectWithValue((e as ApiError).message);
    }
  },
);

export const budgetPut = createAsyncThunk(
  "Budget/put",
  async (
    { id, limitAmount }: { id: string; limitAmount: number },
    { rejectWithValue },
  ) => {
    try {
      const res = await API.put(`${BUDGET}/${id}`, { id, limitAmount });
      if (res.message) notify.success(res.message);
      return res;
    } catch (e) {
      return rejectWithValue((e as ApiError).message);
    }
  },
);

export const budgetDelete = createAsyncThunk(
  "Budget/delete",
  async ({ id }: { id: string }, { rejectWithValue }) => {
    try {
      const res = await API.delete(`${BUDGET}/${id}`);
      if (res.message) notify.success(res.message);
      return res;
    } catch (e) {
      return rejectWithValue((e as ApiError).message);
    }
  },
);

export const budgetShare = createAsyncThunk(
  "Budget/share",
  async ({ id, userName }: { id: string; userName: string }, { rejectWithValue }) => {
    try {
      const res = await API.post(`${BUDGET}/${id}/share`, { userName });
      if (res.message) notify.success(res.message);
      return res;
    } catch (e) {
      return rejectWithValue((e as ApiError).message);
    }
  },
);

export const budgetUnshare = createAsyncThunk(
  "Budget/unshare",
  async ({ id, userId }: { id: string; userId: string }, { rejectWithValue }) => {
    try {
      const res = await API.post(`${BUDGET}/${id}/unshare`, { userId });
      if (res.message) notify.success(res.message);
      return res;
    } catch (e) {
      return rejectWithValue((e as ApiError).message);
    }
  },
);

// Lời mời chia sẻ ngân sách nhận được (chờ chấp nhận/từ chối).
export const budgetGetInvites = createAsyncThunk(
  "Budget/getInvites",
  async (params: QueryParams = {}) =>
    API.get<Pagination<BudgetInviteViewModel>>(`${BUDGET}/invites`, { page: 1, size: 50, ...params }),
);

export const budgetInviteCount = createAsyncThunk(
  "Budget/inviteCount",
  async () => API.get<number>(`${BUDGET}/invites/pending-count`),
);

export const budgetAcceptInvite = createAsyncThunk(
  "Budget/acceptInvite",
  async ({ id }: { id: string }, { rejectWithValue }) => {
    try {
      const res = await API.post(`${BUDGET}/invites/${id}/accept`);
      if (res.message) notify.success(res.message);
      return res;
    } catch (e) {
      return rejectWithValue((e as ApiError).message);
    }
  },
);

export const budgetDeclineInvite = createAsyncThunk(
  "Budget/declineInvite",
  async ({ id }: { id: string }, { rejectWithValue }) => {
    try {
      const res = await API.post(`${BUDGET}/invites/${id}/decline`);
      if (res.message) notify.success(res.message);
      return res;
    } catch (e) {
      return rejectWithValue((e as ApiError).message);
    }
  },
);

interface BudgetState {
  pagination?: Pagination<BudgetViewModel>;
  progress: BudgetProgressViewModel[];
  invites?: Pagination<BudgetInviteViewModel>;
  pendingInviteCount: number;
  isLoading: boolean;
  isSubmitting: boolean;
  isInviteLoading: boolean;
  isInviteSubmitting: boolean;
  status: string;
  errorMessage?: string;
}

const initialState: BudgetState = {
  progress: [],
  pendingInviteCount: 0,
  isLoading: false,
  isSubmitting: false,
  isInviteLoading: false,
  isInviteSubmitting: false,
  status: "idle",
};

const slice = createSlice({
  name: "Budget",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(budgetGet.pending, (s) => {
        s.isLoading = true;
      })
      .addCase(budgetGet.fulfilled, (s, { payload }) => {
        s.isLoading = false;
        s.pagination = payload.data;
      })
      .addCase(budgetGet.rejected, (s, { error }) => {
        s.isLoading = false;
        s.errorMessage = error.message;
      })
      .addCase(budgetGetProgress.fulfilled, (s, { payload }) => {
        s.progress = payload.data ?? [];
      })
      .addCase(budgetPost.pending, (s) => {
        s.isSubmitting = true;
        s.status = "post.pending";
      })
      .addCase(budgetPost.fulfilled, (s) => {
        s.isSubmitting = false;
        s.status = "post.fulfilled";
      })
      .addCase(budgetPost.rejected, (s, { payload }) => {
        s.isSubmitting = false;
        s.errorMessage = payload as string;
        s.status = "post.rejected";
      })
      .addCase(budgetPut.pending, (s) => {
        s.isSubmitting = true;
      })
      .addCase(budgetPut.fulfilled, (s) => {
        s.isSubmitting = false;
        s.status = "put.fulfilled";
      })
      .addCase(budgetPut.rejected, (s, { payload }) => {
        s.isSubmitting = false;
        s.errorMessage = payload as string;
      })
      .addCase(budgetDelete.fulfilled, (s) => {
        s.status = "delete.fulfilled";
      })
      .addCase(budgetGetInvites.pending, (s) => {
        s.isInviteLoading = true;
      })
      .addCase(budgetGetInvites.fulfilled, (s, { payload }) => {
        s.isInviteLoading = false;
        s.invites = payload.data;
      })
      .addCase(budgetGetInvites.rejected, (s) => {
        s.isInviteLoading = false;
      })
      .addCase(budgetInviteCount.fulfilled, (s, { payload }) => {
        s.pendingInviteCount = payload.data ?? 0;
      })
      .addCase(budgetAcceptInvite.pending, (s) => {
        s.isInviteSubmitting = true;
      })
      .addCase(budgetAcceptInvite.fulfilled, (s) => {
        s.isInviteSubmitting = false;
      })
      .addCase(budgetAcceptInvite.rejected, (s) => {
        s.isInviteSubmitting = false;
      })
      .addCase(budgetDeclineInvite.pending, (s) => {
        s.isInviteSubmitting = true;
      })
      .addCase(budgetDeclineInvite.fulfilled, (s) => {
        s.isInviteSubmitting = false;
      })
      .addCase(budgetDeclineInvite.rejected, (s) => {
        s.isInviteSubmitting = false;
      });
  },
});

export const budgetSlice = slice;

export const BudgetFacade = () => {
  const dispatch = useAppDispatch();
  const state = useTypedSelector((s) => s.budget);
  return {
    ...state,
    get: (params?: QueryParams) => dispatch(budgetGet(params ?? {})),
    getProgress: (params: { month?: number; year?: number; categoryId?: string }) =>
      dispatch(budgetGetProgress(params)),
    post: (values: BudgetUpsertModel) => dispatch(budgetPost({ values })),
    put: (id: string, limitAmount: number) => dispatch(budgetPut({ id, limitAmount })),
    delete: (id: string) => dispatch(budgetDelete({ id })),
    share: (id: string, userName: string) => dispatch(budgetShare({ id, userName })),
    unshare: (id: string, userId: string) => dispatch(budgetUnshare({ id, userId })),
    getInvites: (params?: QueryParams) => dispatch(budgetGetInvites(params ?? {})),
    getInviteCount: () => dispatch(budgetInviteCount()),
    acceptInvite: (id: string) => dispatch(budgetAcceptInvite({ id })),
    declineInvite: (id: string) => dispatch(budgetDeclineInvite({ id })),
  };
};
