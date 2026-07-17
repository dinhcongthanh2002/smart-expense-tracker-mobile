import { Action } from "@/store/action";
import { Slice, type State } from "@/store/slice";
import { useAppDispatch, useTypedSelector } from "@/store/hooks";
import { API } from "@/lib/api";
import type { QueryParams } from "@/models/api.model";
import type { BillSplitUpsertModel, BillSplitViewModel } from "./model";

const action = new Action<BillSplitViewModel>("BillSplit");
export const billSplitAction = action;
export const billSplitSlice = new Slice<BillSplitViewModel>(action);

/** Toggle whether a participant has settled (paid you back). */
export async function settleBillParticipant(
  billSplitId: string,
  participantId: string,
  settled: boolean,
): Promise<void> {
  await API.put(
    `/bill-splits/${billSplitId}/participants/${participantId}/settle`,
    {},
    { settled },
  );
}

export const BillSplitFacade = () => {
  const dispatch = useAppDispatch();
  const state = useTypedSelector((s) => s.billSplit);
  return {
    ...state,
    get: (params?: QueryParams) => dispatch(action.get(params ?? {})),
    getById: (id: string) => dispatch(action.getById({ id })),
    post: (values: BillSplitUpsertModel) =>
      dispatch(action.post({ values: values as Partial<BillSplitViewModel> })),
    put: (values: BillSplitUpsertModel & { id: string }) =>
      dispatch(action.put({ values: values as Partial<BillSplitViewModel> & { id: string } })),
    delete: (id: string) => dispatch(action.delete({ id })),
    set: (payload: Partial<State<BillSplitViewModel>>) =>
      dispatch(billSplitSlice.setAction(payload)),
  };
};
