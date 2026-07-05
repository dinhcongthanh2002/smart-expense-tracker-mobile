import { combineReducers, configureStore } from "@reduxjs/toolkit";

import { globalSlice } from "./global";
import { categorySlice } from "./category";
import { transactionSlice } from "./transaction";
import { statisticSlice } from "./statistic";
import { walletSlice } from "./wallet";
import { budgetSlice } from "./budget";
import { debtSlice } from "./debt";
import { savingsGoalSlice } from "./savingsGoal";
import { recurringSlice } from "./recurring";
import { notificationSlice } from "./notification";

const rootReducer = combineReducers({
  global: globalSlice.reducer,
  category: categorySlice.reducer,
  transaction: transactionSlice.reducer,
  statistic: statisticSlice.reducer,
  wallet: walletSlice.reducer,
  budget: budgetSlice.reducer,
  debt: debtSlice.reducer,
  savingsGoal: savingsGoalSlice.reducer,
  recurring: recurringSlice.reducer,
  notification: notificationSlice.reducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
