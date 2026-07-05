import { createAsyncThunk } from "@reduxjs/toolkit";

import { API } from "@/lib/api";
import { routerLinks } from "@/lib/router-links";
import { notify } from "@/lib/notify";
import type {
  CommonEntity,
  Pagination,
  QueryParams,
  Responses,
} from "@/models/api.model";

/**
 * Generic CRUD thunk factory — mirrors the admin FE `store/action.ts`.
 * Every entity gets `get`, `getById`, `post`, `put`, `delete` thunks that hit
 * the endpoint resolved from `routerLinks(name)`.
 */
export class Action<T extends CommonEntity> {
  public readonly name: string;
  public readonly endpoint: string;

  public readonly get;
  public readonly getById;
  public readonly post;
  public readonly put;
  public readonly delete;

  constructor(name: string) {
    this.name = name;
    const endpoint = routerLinks(name);
    this.endpoint = endpoint;

    this.get = createAsyncThunk(
      `${name}/get`,
      async (params: QueryParams = {}) => {
        return await API.get<Pagination<T>>(endpoint, {
          page: 1,
          size: 20,
          ...params,
        });
      },
    );

    this.getById = createAsyncThunk(
      `${name}/getById`,
      async ({ id }: { id: string }) => {
        return await API.get<T>(`${endpoint}/${id}`);
      },
    );

    this.post = createAsyncThunk(
      `${name}/post`,
      async ({ values }: { values: Partial<T> }, { rejectWithValue }) => {
        try {
          const res = await API.post<T>(endpoint, values);
          if (res.message) notify.success(res.message);
          return res;
        } catch (e) {
          return rejectWithValue((e as Error).message);
        }
      },
    );

    this.put = createAsyncThunk(
      `${name}/put`,
      async (
        { values }: { values: Partial<T> & { id: string } },
        { rejectWithValue },
      ) => {
        try {
          const res = await API.put<T>(`${endpoint}/${values.id}`, values);
          if (res.message) notify.success(res.message);
          return res;
        } catch (e) {
          return rejectWithValue((e as Error).message);
        }
      },
    );

    this.delete = createAsyncThunk(
      `${name}/delete`,
      async ({ id }: { id: string }, { rejectWithValue }) => {
        try {
          const res = await API.delete<Responses<T>>(`${endpoint}/${id}`);
          if (res.message) notify.success(res.message);
          return res;
        } catch (e) {
          return rejectWithValue((e as Error).message);
        }
      },
    );
  }
}
