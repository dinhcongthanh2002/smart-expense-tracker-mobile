import { createAsyncThunk } from "@reduxjs/toolkit";

import { Action } from "@/store/action";
import { Slice, type State } from "@/store/slice";
import { useAppDispatch, useTypedSelector } from "@/store/hooks";
import { API, ApiError } from "@/lib/api";
import { routerLinks } from "@/lib/router-links";
import { notify } from "@/lib/notify";
import type { QueryParams } from "@/models/api.model";
import type { SavingsGoalUpsertModel, SavingsGoalViewModel } from "./model";

const action = new Action<SavingsGoalViewModel>("SavingsGoal");
export const savingsGoalAction = action;
export const savingsGoalSlice = new Slice<SavingsGoalViewModel>(action);

/** Add money toward a savings goal. */
export const savingsGoalContribute = createAsyncThunk(
  "SavingsGoal/contribute",
  async ({ id, amount }: { id: string; amount: number }, { rejectWithValue }) => {
    try {
      const res = await API.post(
        `${routerLinks("SavingsGoal")}/${id}/contribute`,
        { amount },
      );
      if (res.message) notify.success(res.message);
      return res;
    } catch (e) {
      return rejectWithValue((e as ApiError).message);
    }
  },
);

export const SavingsGoalFacade = () => {
  const dispatch = useAppDispatch();
  const state = useTypedSelector((s) => s.savingsGoal);
  return {
    ...state,
    get: (params?: QueryParams) => dispatch(action.get(params ?? {})),
    getById: (id: string) => dispatch(action.getById({ id })),
    post: (values: SavingsGoalUpsertModel) =>
      dispatch(action.post({ values: values as Partial<SavingsGoalViewModel> })),
    put: (values: SavingsGoalUpsertModel & { id: string }) =>
      dispatch(action.put({ values: values as Partial<SavingsGoalViewModel> & { id: string } })),
    delete: (id: string) => dispatch(action.delete({ id })),
    contribute: (id: string, amount: number) =>
      dispatch(savingsGoalContribute({ id, amount })),
    set: (payload: Partial<State<SavingsGoalViewModel>>) =>
      dispatch(savingsGoalSlice.setAction(payload)),
  };
};
