/**
 * Small, dependency-free helpers shared by the Organization Settings tabs.
 */

/** Read a dotted path off a nested object (`"contacts.payroll.name"`). */
export const getPath = (obj: unknown, path: string): unknown =>
  path.split(".").reduce<any>((o, k) => (o == null ? o : o[k]), obj as any) ?? "";

/** Immutably set a dotted path on a nested object and return the new value. */
export function setDeep<T extends object>(obj: T, path: string, value: unknown): T {
  const parts = path.split(".");
  const next: any = { ...obj };
  let cur: any = next;
  for (let i = 0; i < parts.length - 1; i++) {
    cur[parts[i]] = { ...cur[parts[i]] };
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
  return next;
}

/** Format a number as Rand. Negative numbers are kept as-is. */
export const formatRand = (n: number): string =>
  `R ${Number(n || 0).toLocaleString()}`;

/** Authorization header for our backend (or undefined if no token yet). */
export const authHeader = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/** Header for a JSON POST/PUT request. */
export const jsonHeaders = (): Record<string, string> => ({
  ...authHeader(),
  "Content-Type": "application/json",
});

/** First and last day of the current month, as `YYYY-MM-DD`. */
export const currentMonthRange = (): { start: string; end: string } => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { start, end };
};

/** Generate a SARS-style submission receipt. Pure client-side mock. */
export const makeSarsReceipt = (): string =>
  `SARS-REC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
