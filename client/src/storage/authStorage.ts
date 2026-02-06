const KEY = "auth";

export type AuthState = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  isAdmin?: boolean;
  isProUser?: boolean,
  userId?: number;
  username?: string
};

export function setAuth(state: AuthState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function getAuth(): AuthState | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthState;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return getAuth()?.accessToken ?? null;
}

export function getIsAdmin(): boolean {
  return Boolean(getAuth()?.isAdmin);
}

export function clearAuth() {
  localStorage.removeItem(KEY);
}

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}
export function getUserId(): number | null {
  return getAuth()?.userId ?? null;
}
export function getIsProUser(): boolean {
  return Boolean(getAuth()?.isProUser);
}
export function getUsername(): string | null {
    return getAuth()?.username ?? null;
}
export const authStorage = {
  setAccessToken(token: string) {
    const cur = getAuth() ?? ({} as AuthState);
    setAuth({ ...cur, accessToken: token });
  },
  setRefreshToken(token: string) {
    const cur = getAuth() ?? ({} as AuthState);
    setAuth({ ...cur, refreshToken: token });
  },
  setExpiresIn(expiresIn: number) {
    const cur = getAuth() ?? ({} as AuthState);
    setAuth({ ...cur, expiresIn });
  },
  setIsAdmin(isAdmin: boolean) {
    const cur = getAuth() ?? ({} as AuthState);
    setAuth({ ...cur, isAdmin });
  },
  setUserId(userId: number) {
    const cur = getAuth() ?? ({} as AuthState);
    setAuth({ ...cur, userId });
  },
  setIsProUser(isProUser: boolean) {
    const cur = getAuth() ?? ({} as AuthState);
    setAuth({ ...cur, isProUser });
  },
  setUsername(username: string) {
    const cur = getAuth() ?? ({} as AuthState);
    setAuth({ ...cur, username });
  },
  getUsername(): string | null {
    return getUsername();
  },
  getAccessToken() {
    return getAccessToken();
  },
  getIsAdmin() {
    return getIsAdmin();
  },
  getRefreshToken() {
    return getAuth()?.refreshToken ?? null;
  },
  getUserId() {
    return getUserId();
  },
  getExpiresIn() {
    return getAuth()?.expiresIn ?? null;
  },
  isLoggedIn() {
    return isLoggedIn();
  },
  isProUser() {
    return getIsProUser();
  },
  clear() {
    clearAuth();
  },
  clearAll() {
    clearAuth();
  },
};