import { API_BASE_URL } from "../config/apiBase";

type CommonResponse<T> = {
  isSuccessful?: boolean;   // backend ví dụ
  isSuccessfull?: boolean;  // theo prompt.txt
  data: T;
  code: string;
  message: string;
};

function okFlag(x: any) {
  return x?.isSuccessful ?? x?.isSuccessfull;
}

async function parseJson(res: Response): Promise<any> {
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function unwrap<T>(res: Response): Promise<T> {
  const json = (await parseJson(res)) as CommonResponse<T>;
  if (!res.ok || !okFlag(json)) throw new Error(json?.message || `Request failed (${res.status})`);
  return json.data;
}

// types giữ nguyên như trước
export type RegisterRequest = { userName: string; email: string; password: string };
export type RegisterResponse = { userId: string; username: string; email: string };

export type LoginRequest = { userName: string; password: string };
export type LoginResponse = { accessToken: string; refreshToken: string; expiresIn: number; isAdmin: boolean,userId: number,isProUser: boolean};

export type RefreshRequest = { refreshToken: string };
export type RefreshResponse = { accessToken: string; expiresIn: number };

export type LogoutRequest = { refreshToken: string };
export type LogoutResponse = string; // "Logged out"

export async function registerApi(body: RegisterRequest): Promise<RegisterResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return unwrap<RegisterResponse>(res);
}

export async function loginApi(body: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return unwrap<LoginResponse>(res);
}

export async function refreshApi(body: RefreshRequest): Promise<RefreshResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return unwrap<RefreshResponse>(res);
}

export async function logoutApi(body: LogoutRequest): Promise<LogoutResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return unwrap<LogoutResponse>(res);
}