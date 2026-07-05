import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { API } from "@/lib/api";
import { routerLinks } from "@/lib/router-links";
import { useAppDispatch, useTypedSelector } from "@/store/hooks";
import type { DailyBreakdown, StatisticsDashboard } from "./model";

const STAT = routerLinks("Statistic");

export const getStatistic = createAsyncThunk(
  "Statistic/dashboard",
  async (params: { startDate: string; endDate: string }) => {
    return await API.get<StatisticsDashboard>(`${STAT}/dashboard`, {
      StartDate: params.startDate,
      EndDate: params.endDate,
    });
  },
);

export const getDailyBreakdown = createAsyncThunk(
  "Statistic/daily",
  async (params: { month: number; year: number }) => {
    return await API.get<DailyBreakdown[]>(`${STAT}/daily-breakdown`, {
      Month: params.month,
      Year: params.year,
    });
  },
);

interface StatisticState {
  dashboard?: StatisticsDashboard;
  dailyBreakdown: DailyBreakdown[];
  isLoading: boolean;
  isDailyLoading: boolean;
  errorMessage?: string;
}

const initialState: StatisticState = {
  dailyBreakdown: [],
  isLoading: false,
  isDailyLoading: false,
};

const slice = createSlice({
  name: "Statistic",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getStatistic.pending, (s) => {
        s.isLoading = true;
      })
      .addCase(getStatistic.fulfilled, (s, { payload }) => {
        s.isLoading = false;
        s.dashboard = payload.data;
      })
      .addCase(getStatistic.rejected, (s, { error }) => {
        s.isLoading = false;
        s.errorMessage = error.message;
      })
      .addCase(getDailyBreakdown.pending, (s) => {
        s.isDailyLoading = true;
      })
      .addCase(getDailyBreakdown.fulfilled, (s, { payload }) => {
        s.isDailyLoading = false;
        s.dailyBreakdown = payload.data ?? [];
      })
      .addCase(getDailyBreakdown.rejected, (s) => {
        s.isDailyLoading = false;
      });
  },
});

export const statisticSlice = slice;

export const StatisticFacade = () => {
  const dispatch = useAppDispatch();
  const state = useTypedSelector((s) => s.statistic);
  return {
    ...state,
    getStatistic: (params: { startDate: string; endDate: string }) =>
      dispatch(getStatistic(params)),
    getDailyBreakdown: (params: { month: number; year: number }) =>
      dispatch(getDailyBreakdown(params)),
  };
};
