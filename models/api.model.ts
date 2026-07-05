// Mirrors the API response envelope used by the .NET backend
// (SmartExpenseTracker.Common/Utils/ResponseData.cs) and the admin FE models.

export interface Responses<T> {
  code?: number;
  message?: string;
  data?: T;
  count?: number;
  isSuccess?: boolean;
  totalTime?: number;
  errorDetail?: Array<Record<string, unknown>>;
}

/** Base fields shared by every persisted entity (audit columns). */
export interface CommonEntity {
  id?: string;
  createdByUserId?: string;
  lastModifiedByUserId?: string;
  lastModifiedOnDate?: string;
  createdOnDate?: string;
  createdByUserName?: string;
  lastModifiedByUserName?: string;
}

export interface QueryParams {
  id?: string;
  size?: number;
  page?: number;
  sort?: string;
  fullTextSearch?: string;
  /** Serialized to a JSON string in the query (`?filter={...}`). */
  filter?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface Pagination<T> {
  content: T[];
  numberOfElements: number;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
