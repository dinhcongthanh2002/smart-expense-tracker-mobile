import { Action } from "@/store/action";
import { Slice, type State } from "@/store/slice";
import { useAppDispatch, useTypedSelector } from "@/store/hooks";
import type { QueryParams } from "@/models/api.model";
import type { RecurringUpsertModel, RecurringViewModel } from "./model";

const action = new Action<RecurringViewModel>("Recurring");
export const recurringAction = action;
export const recurringSlice = new Slice<RecurringViewModel>(action);

export const RecurringFacade = () => {
  const dispatch = useAppDispatch();
  const state = useTypedSelector((s) => s.recurring);
  return {
    ...state,
    get: (params?: QueryParams) => dispatch(action.get(params ?? {})),
    getById: (id: string) => dispatch(action.getById({ id })),
    post: (values: RecurringUpsertModel) =>
      dispatch(action.post({ values: values as Partial<RecurringViewModel> })),
    put: (values: RecurringUpsertModel & { id: string }) =>
      dispatch(action.put({ values: values as Partial<RecurringViewModel> & { id: string } })),
    delete: (id: string) => dispatch(action.delete({ id })),
    set: (payload: Partial<State<RecurringViewModel>>) =>
      dispatch(recurringSlice.setAction(payload)),
  };
};
