import { combineReducers, configureStore } from "@reduxjs/toolkit";

import { globalSlice } from "./global";
import { categorySlice } from "./category";
import { transactionSlice } from "./transaction";
import { statisticSlice } from "./statistic";

const rootReducer = combineReducers({
  global: globalSlice.reducer,
  category: categorySlice.reducer,
  transaction: transactionSlice.reducer,
  statistic: statisticSlice.reducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
