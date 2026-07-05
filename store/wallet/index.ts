import { Action } from "@/store/action";
import { Slice, type State } from "@/store/slice";
import { useAppDispatch, useTypedSelector } from "@/store/hooks";
import type { QueryParams } from "@/models/api.model";
import type { WalletUpsertModel, WalletViewModel } from "./model";

const action = new Action<WalletViewModel>("Wallet");
export const walletAction = action;
export const walletSlice = new Slice<WalletViewModel>(action);

export const WalletFacade = () => {
  const dispatch = useAppDispatch();
  const state = useTypedSelector((s) => s.wallet);
  return {
    ...state,
    get: (params?: QueryParams) => dispatch(action.get(params ?? {})),
    getById: (id: string) => dispatch(action.getById({ id })),
    post: (values: WalletUpsertModel) =>
      dispatch(action.post({ values: values as Partial<WalletViewModel> })),
    put: (values: WalletUpsertModel & { id: string }) =>
      dispatch(action.put({ values: values as Partial<WalletViewModel> & { id: string } })),
    delete: (id: string) => dispatch(action.delete({ id })),
    set: (payload: Partial<State<WalletViewModel>>) =>
      dispatch(walletSlice.setAction(payload)),
  };
};
