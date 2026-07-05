import {
  createSlice,
  type Draft,
  type PayloadAction,
  type Slice as RTKSlice,
} from "@reduxjs/toolkit";

import type { CommonEntity, Pagination } from "@/models/api.model";
import { EStatusState } from "@/models/status.model";
import type { Action } from "./action";

/** Standard per-entity state envelope (mirrors admin FE `store/slice.ts`). */
export interface State<T> {
  pagination?: Pagination<T>;
  data?: T;
  isLoading: boolean;
  isSubmitting: boolean;
  status: EStatusState | string;
  errorMessage?: string;
}

export function initialCrudState<T>(overrides?: Partial<State<T>>): State<T> {
  return {
    isLoading: false,
    isSubmitting: false,
    status: EStatusState.idle,
    ...overrides,
  };
}

/**
 * Wires an `Action<T>`'s thunk lifecycle into a reducer. Returns the reducer
 * plus the `set` action for synchronous state patches (used by facades).
 */
export class Slice<T extends CommonEntity> {
  public readonly reducer: RTKSlice<State<T>>["reducer"];
  public readonly setAction: (payload: Partial<State<T>>) => PayloadAction<Partial<State<T>>>;

  constructor(action: Action<T>, overrides?: Partial<State<T>>) {
    const slice = createSlice({
      name: action.name,
      initialState: initialCrudState<T>(overrides),
      reducers: {
        set: (state, { payload }: PayloadAction<Partial<State<T>>>) => {
          Object.assign(state, payload);
          state.status = EStatusState.setFulfilled;
        },
      },
      extraReducers: (builder) => {
        builder
          // list
          .addCase(action.get.pending, (s) => {
            s.isLoading = true;
            s.status = EStatusState.getPending;
          })
          .addCase(action.get.fulfilled, (s, { payload }) => {
            s.isLoading = false;
            s.pagination = payload.data as Draft<Pagination<T>> | undefined;
            s.status = EStatusState.getFulfilled;
          })
          .addCase(action.get.rejected, (s, { error }) => {
            s.isLoading = false;
            s.errorMessage = error.message;
            s.status = EStatusState.getRejected;
          })
          // detail
          .addCase(action.getById.pending, (s) => {
            s.isLoading = true;
            s.status = EStatusState.getByIdPending;
          })
          .addCase(action.getById.fulfilled, (s, { payload }) => {
            s.isLoading = false;
            s.data = payload.data as unknown as typeof s.data;
            s.status = EStatusState.getByIdFulfilled;
          })
          .addCase(action.getById.rejected, (s, { error }) => {
            s.isLoading = false;
            s.errorMessage = error.message;
            s.status = EStatusState.getByIdRejected;
          })
          // create
          .addCase(action.post.pending, (s) => {
            s.isSubmitting = true;
            s.status = EStatusState.postPending;
          })
          .addCase(action.post.fulfilled, (s, { payload }) => {
            s.isSubmitting = false;
            s.data = payload.data as unknown as typeof s.data;
            s.status = EStatusState.postFulfilled;
          })
          .addCase(action.post.rejected, (s, { payload, error }) => {
            s.isSubmitting = false;
            s.errorMessage = (payload as string) ?? error.message;
            s.status = EStatusState.postRejected;
          })
          // update
          .addCase(action.put.pending, (s) => {
            s.isSubmitting = true;
            s.status = EStatusState.putPending;
          })
          .addCase(action.put.fulfilled, (s, { payload }) => {
            s.isSubmitting = false;
            s.data = payload.data as unknown as typeof s.data;
            s.status = EStatusState.putFulfilled;
          })
          .addCase(action.put.rejected, (s, { payload, error }) => {
            s.isSubmitting = false;
            s.errorMessage = (payload as string) ?? error.message;
            s.status = EStatusState.putRejected;
          })
          // delete
          .addCase(action.delete.pending, (s) => {
            s.isSubmitting = true;
            s.status = EStatusState.deletePending;
          })
          .addCase(action.delete.fulfilled, (s) => {
            s.isSubmitting = false;
            s.status = EStatusState.deleteFulfilled;
          })
          .addCase(action.delete.rejected, (s, { payload, error }) => {
            s.isSubmitting = false;
            s.errorMessage = (payload as string) ?? error.message;
            s.status = EStatusState.deleteRejected;
          });
      },
    });

    this.reducer = slice.reducer;
    this.setAction = slice.actions.set as unknown as Slice<T>["setAction"];
  }
}
