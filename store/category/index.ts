import { Action } from "@/store/action";
import { Slice, type State } from "@/store/slice";
import { useAppDispatch, useTypedSelector } from "@/store/hooks";
import type { QueryParams } from "@/models/api.model";
import type { CategoryViewModel } from "./model";

const action = new Action<CategoryViewModel>("Category");
export const categoryAction = action;
export const categorySlice = new Slice<CategoryViewModel>(action);

export const CategoryFacade = () => {
  const dispatch = useAppDispatch();
  const state = useTypedSelector((s) => s.category);
  return {
    ...state,
    get: (params?: QueryParams) => dispatch(action.get(params ?? {})),
    getById: (id: string) => dispatch(action.getById({ id })),
    post: (values: Partial<CategoryViewModel>) => dispatch(action.post({ values })),
    put: (values: Partial<CategoryViewModel> & { id: string }) =>
      dispatch(action.put({ values })),
    delete: (id: string) => dispatch(action.delete({ id })),
    set: (payload: Partial<State<CategoryViewModel>>) =>
      dispatch(categorySlice.setAction(payload)),
  };
};
