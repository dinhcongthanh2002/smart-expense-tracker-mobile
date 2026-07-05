import { Action } from "@/store/action";
import { Slice, type State } from "@/store/slice";
import { useAppDispatch, useTypedSelector } from "@/store/hooks";
import type { QueryParams } from "@/models/api.model";
import type { TransactionUpsertModel, TransactionViewModel } from "./model";

const action = new Action<TransactionViewModel>("Transaction");
export const transactionAction = action;
export const transactionSlice = new Slice<TransactionViewModel>(action);

export const TransactionFacade = () => {
  const dispatch = useAppDispatch();
  const state = useTypedSelector((s) => s.transaction);
  return {
    ...state,
    get: (params?: QueryParams) => dispatch(action.get(params ?? {})),
    getById: (id: string) => dispatch(action.getById({ id })),
    post: (values: TransactionUpsertModel) =>
      dispatch(action.post({ values: values as Partial<TransactionViewModel> })),
    put: (values: TransactionUpsertModel & { id: string }) =>
      dispatch(action.put({ values: values as Partial<TransactionViewModel> & { id: string } })),
    delete: (id: string) => dispatch(action.delete({ id })),
    set: (payload: Partial<State<TransactionViewModel>>) =>
      dispatch(transactionSlice.setAction(payload)),
  };
};
