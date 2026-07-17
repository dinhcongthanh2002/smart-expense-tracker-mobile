import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { API } from "@/lib/api";
import { routerLinks } from "@/lib/router-links";
import { useAppDispatch, useTypedSelector } from "@/store/hooks";
import type {
  CashFlowForecast,
  DailyBreakdown,
  NetWorth,
  StatisticsDashboard,
} from "./model";

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

export const getNetWorth = createAsyncThunk("Statistic/netWorth", async () => {
  return await API.get<NetWorth>(`${STAT}/net-worth`);
});

export const getForecast = createAsyncThunk("Statistic/forecast", async () => {
  return await API.get<CashFlowForecast>(`${STAT}/cash-flow-forecast`);
});

interface StatisticState {
  dashboard?: StatisticsDashboard;
  dailyBreakdown: DailyBreakdown[];
  netWorth?: NetWorth;
  forecast?: CashFlowForecast;
  isLoading: boolean;
  isDailyLoading: boolean;
  isNetWorthLoading: boolean;
  errorMessage?: string;
}

const initialState: StatisticState = {
  dailyBreakdown: [],
  isLoading: false,
  isDailyLoading: false,
  isNetWorthLoading: false,
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
      })
      .addCase(getNetWorth.pending, (s) => {
        s.isNetWorthLoading = true;
      })
      .addCase(getNetWorth.fulfilled, (s, { payload }) => {
        s.isNetWorthLoading = false;
        s.netWorth = payload.data;
      })
      .addCase(getNetWorth.rejected, (s) => {
        s.isNetWorthLoading = false;
      })
      .addCase(getForecast.fulfilled, (s, { payload }) => {
        s.forecast = payload.data;
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
    getNetWorth: () => dispatch(getNetWorth()),
    getForecast: () => dispatch(getForecast()),
  };
};
