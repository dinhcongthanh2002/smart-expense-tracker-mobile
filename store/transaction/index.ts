import { Action } from "@/store/action";
import { Slice, type State } from "@/store/slice";
import { useAppDispatch, useTypedSelector } from "@/store/hooks";
import { API } from "@/lib/api";
import { refreshWidget } from "@/lib/widget";
import type { QueryParams } from "@/models/api.model";
import type {
  TransactionParseResult,
  TransactionSummary,
  TransactionUpsertModel,
  TransactionViewModel,
} from "./model";

const action = new Action<TransactionViewModel>("Transaction");

/**
 * Ask the backend to parse a spoken/typed phrase into a draft transaction.
 * Not a redux thunk — the quick-add sheet consumes the draft locally and only
 * persists via `TransactionFacade.post` after the user confirms.
 */
export async function parseTransactionText(
  text: string,
  walletId?: string,
): Promise<TransactionParseResult | undefined> {
  const res = await API.post<TransactionParseResult>("/transactions/parse", {
    text,
    walletId,
  });
  return res.data;
}
/**
 * Fetch total income/expense for the current filter (the same `filter` object the
 * list sends). Totals are computed on the server across ALL matching rows, so they
 * are correct regardless of pagination. Not a redux thunk — the list reads it directly.
 */
export async function getTransactionSummary(
  filter: Record<string, unknown>,
): Promise<TransactionSummary | undefined> {
  const res = await API.get<TransactionSummary>("/transactions/summary", { filter });
  return res.data;
}

export const transactionAction = action;
export const transactionSlice = new Slice<TransactionViewModel>(action);

export const TransactionFacade = () => {
  const dispatch = useAppDispatch();
  const state = useTypedSelector((s) => s.transaction);
  return {
    ...state,
    get: (params?: QueryParams) => dispatch(action.get(params ?? {})),
    getById: (id: string) => dispatch(action.getById({ id })),
    post: (values: TransactionUpsertModel) => {
      const p = dispatch(action.post({ values: values as Partial<TransactionViewModel> }));
      p.then((res) => {
        if (res.meta.requestStatus === "fulfilled") refreshWidget();
      });
      return p;
    },
    put: (values: TransactionUpsertModel & { id: string }) => {
      const p = dispatch(
        action.put({ values: values as Partial<TransactionViewModel> & { id: string } }),
      );
      p.then((res) => {
        if (res.meta.requestStatus === "fulfilled") refreshWidget();
      });
      return p;
    },
    delete: (id: string) => {
      const p = dispatch(action.delete({ id }));
      p.then((res) => {
        if (res.meta.requestStatus === "fulfilled") refreshWidget();
      });
      return p;
    },
    set: (payload: Partial<State<TransactionViewModel>>) =>
      dispatch(transactionSlice.setAction(payload)),
  };
};
