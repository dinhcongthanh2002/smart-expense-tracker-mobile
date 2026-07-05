import { linkApi, STORAGE_KEYS, DEFAULT_LANGUAGE } from "./constants";
import { getAuthTokenSync, clearAuthStorage } from "./secure-storage";
import { notify } from "./notify";
import type { QueryParams, Responses } from "@/models/api.model";
import AsyncStorage from "@react-native-async-storage/async-storage";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public payload?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Registered by the app root so the API layer can force a logout on 401
// without importing navigation/redux here.
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

// Cached language for the Accept-Language header (updated opportunistically).
let languageCache = DEFAULT_LANGUAGE;
AsyncStorage.getItem(STORAGE_KEYS.language).then((v) => {
  if (v) languageCache = v;
});
export const setLanguage = (lang: string) => {
  languageCache = lang;
};

function toQueryString(params?: QueryParams): string {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (typeof value === "object") {
      search.append(key, JSON.stringify(value));
    } else {
      search.append(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

function buildInit(
  method: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
): RequestInit {
  const token = getAuthTokenSync();
  return {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Language": languageCache,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };
}

async function request<T>(
  url: string,
  init: RequestInit,
  params?: QueryParams,
): Promise<Responses<T>> {
  const fullUrl = `${url.startsWith("http") ? "" : linkApi}${url}${toQueryString(params)}`;

  let response: Response;
  try {
    response = await fetch(fullUrl, init);
  } catch {
    const message = "Không thể kết nối máy chủ. Kiểm tra kết nối mạng.";
    notify.error(message);
    throw new ApiError(0, message);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const body: Responses<T> | null = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : null;

  if (response.ok) {
    return body ?? ({ isSuccess: true } as Responses<T>);
  }

  const message =
    body?.message ??
    (response.status === 401
      ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
      : "Đã có lỗi xảy ra. Vui lòng thử lại.");

  if (response.status === 401) {
    await clearAuthStorage();
    onUnauthorized?.();
  }

  notify.error(message);
  throw new ApiError(response.status, message, body);
}

export const API = {
  get: <T>(url: string, params?: QueryParams) =>
    request<T>(url, buildInit("GET"), params),

  post: <T>(url: string, data?: unknown, params?: QueryParams) =>
    request<T>(url, buildInit("POST", data ?? {}), params),

  put: <T>(url: string, data?: unknown, params?: QueryParams) =>
    request<T>(url, buildInit("PUT", data ?? {}), params),

  delete: <T>(url: string, data?: unknown) =>
    request<T>(url, buildInit("DELETE", data)),

  /** multipart upload — field name must be `file` (see UploadController). */
  upload: async <T>(url: string, form: FormData) => {
    const token = getAuthTokenSync();
    return request<T>(url, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
  },
};
