import { API_BASE_URL } from "../config/apiBase";
import { getAccessToken, clearAuth } from "../storage/authStorage";
import type { CommonResponse, PageRequestDto, PageResult } from "../types/api";

type HttpMethod = "GET" | "POST" | "DELETE";

function isOk(resp: any): boolean {
  return Boolean(
    resp?.isSuccessFull ??
      resp?.isSuccessfull ??   // ✅ BE của mày đang dùng cái này
      resp?.isSuccessful ??
      false
  );
}

function withPageDefaults<TFilter>(req: PageRequestDto<TFilter>): PageRequestDto<TFilter> {
  return {
    maxResultCount: req.maxResultCount ?? 10,
    skipCount: req.skipCount ?? 0,
    sorting: req.sorting,
    filter: req.filter,
  };
}

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: any,
  extraHeaders?: Record<string, string>
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = { ...(extraHeaders ?? {}) };

  let payload: BodyInit | undefined = undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { method, headers, body: payload });

  if (res.status === 401) {
    clearAuth();
    throw new Error("Unauthorized");
  }

  const json = (await res.json()) as CommonResponse<T> & any;

  if (!isOk(json)) {
    throw new Error(json?.message || json?.code || "Request failed");
  }

  // ✅ unwrap 1 tầng: trả về json.data (đúng CommonResponse)
  return json.data as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: any) => request<T>("POST", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),

  // ✅ tái sử dụng PageRequestDto + PageResult đúng BE
  postPage: <TEntity, TFilter>(path: string, req: PageRequestDto<TFilter>) =>
    request<PageResult<TEntity>>("POST", path, withPageDefaults(req)),
};
