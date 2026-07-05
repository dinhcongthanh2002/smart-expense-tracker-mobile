import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { API } from "@/lib/api";
import { routerLinks } from "@/lib/router-links";
import { useAppDispatch, useTypedSelector } from "@/store/hooks";
import type { Pagination, QueryParams } from "@/models/api.model";
import type { NotificationViewModel } from "./model";

const NOTI = routerLinks("Notification");

export const notificationGet = createAsyncThunk(
  "Notification/get",
  async (params: QueryParams = {}) =>
    API.get<Pagination<NotificationViewModel>>(NOTI, { page: 1, size: 50, ...params }),
);

export const notificationUnreadCount = createAsyncThunk(
  "Notification/unread",
  async () => API.get<number>(`${NOTI}/unread-count`),
);

export const notificationMarkRead = createAsyncThunk(
  "Notification/read",
  async (id: string) => {
    await API.put(`${NOTI}/${id}/read`);
    return id;
  },
);

export const notificationMarkAllRead = createAsyncThunk(
  "Notification/readAll",
  async () => {
    await API.put(`${NOTI}/read-all`);
  },
);

interface NotificationState {
  pagination?: Pagination<NotificationViewModel>;
  unreadCount: number;
  isLoading: boolean;
}

const initialState: NotificationState = { unreadCount: 0, isLoading: false };

const slice = createSlice({
  name: "Notification",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(notificationGet.pending, (s) => {
        s.isLoading = true;
      })
      .addCase(notificationGet.fulfilled, (s, { payload }) => {
        s.isLoading = false;
        s.pagination = payload.data;
      })
      .addCase(notificationGet.rejected, (s) => {
        s.isLoading = false;
      })
      .addCase(notificationUnreadCount.fulfilled, (s, { payload }) => {
        s.unreadCount = payload.data ?? 0;
      })
      .addCase(notificationMarkRead.fulfilled, (s, { payload: id }) => {
        const item = s.pagination?.content.find((n) => n.id === id);
        if (item && !item.isRead) {
          item.isRead = true;
          s.unreadCount = Math.max(0, s.unreadCount - 1);
        }
      })
      .addCase(notificationMarkAllRead.fulfilled, (s) => {
        s.pagination?.content.forEach((n) => (n.isRead = true));
        s.unreadCount = 0;
      });
  },
});

export const notificationSlice = slice;

export const NotificationFacade = () => {
  const dispatch = useAppDispatch();
  const state = useTypedSelector((s) => s.notification);
  return {
    ...state,
    get: (params?: QueryParams) => dispatch(notificationGet(params ?? {})),
    getUnreadCount: () => dispatch(notificationUnreadCount()),
    markRead: (id: string) => dispatch(notificationMarkRead(id)),
    markAllRead: () => dispatch(notificationMarkAllRead()),
  };
};
