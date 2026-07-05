import { createAsyncThunk } from "@reduxjs/toolkit";

import { Action } from "@/store/action";
import { Slice, type State } from "@/store/slice";
import { useAppDispatch, useTypedSelector } from "@/store/hooks";
import { API, ApiError } from "@/lib/api";
import { routerLinks } from "@/lib/router-links";
import { notify } from "@/lib/notify";
import type { QueryParams } from "@/models/api.model";
import type { DebtCreateModel, DebtPayModel, DebtViewModel } from "./model";

const action = new Action<DebtViewModel>("Debt");
export const debtAction = action;
export const debtSlice = new Slice<DebtViewModel>(action);

/** Record a (partial or full) payment against a debt. */
export const debtPay = createAsyncThunk(
  "Debt/pay",
  async ({ id, values }: { id: string; values: DebtPayModel }, { rejectWithValue }) => {
    try {
      const res = await API.post(`${routerLinks("Debt")}/${id}/pay`, values);
      if (res.message) notify.success(res.message);
      return res;
    } catch (e) {
      return rejectWithValue((e as ApiError).message);
    }
  },
);

export const DebtFacade = () => {
  const dispatch = useAppDispatch();
  const state = useTypedSelector((s) => s.debt);
  return {
    ...state,
    get: (params?: QueryParams) => dispatch(action.get(params ?? {})),
    getById: (id: string) => dispatch(action.getById({ id })),
    post: (values: DebtCreateModel) =>
      dispatch(action.post({ values: values as Partial<DebtViewModel> })),
    delete: (id: string) => dispatch(action.delete({ id })),
    pay: (id: string, values: DebtPayModel) => dispatch(debtPay({ id, values })),
    set: (payload: Partial<State<DebtViewModel>>) =>
      dispatch(debtSlice.setAction(payload)),
  };
};
