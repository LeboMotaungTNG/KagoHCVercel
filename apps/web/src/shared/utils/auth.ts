export const LAST_ACTIVITY_KEY = "lastActivityAt";

export const isJwtExpired = (token: string): boolean => {
  try {
    const [, payload] = token.split(".");
    if (!payload) return false;
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    if (typeof json.exp !== "number") return false;
    return json.exp * 1000 < Date.now();
  } catch {
    return false;
  }
};

export const isLoggedIn = (): boolean => {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("token");
  if (!token) return false;
  if (isJwtExpired(token)) {
    clearSession();
    return false;
  }
  return true;
};

export const touchActivity = (): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
};

export const getLastActivity = (): number => {
  if (typeof window === "undefined") return Date.now();
  const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : Date.now();
};

export const clearSession = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem(LAST_ACTIVITY_KEY);
};
