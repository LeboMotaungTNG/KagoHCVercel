/**
 * RequireAuth — route guard for every authenticated page in Kago HC.
 *
 * Behavior:
 *   • Reads `token` and `user` from localStorage.
 *   • If no token → redirect to "/" (login) preserving the attempted URL
 *     in `location.state.from` so the user is returned after signing in.
 *   • If `requireRoles` is provided and the current user's role is not in
 *     the allowed list → redirect to their own role's home (manager →
 *     /manager, employee → /employee, owner → /owner, platform_admin →
 *     /platform) so people don't land on the wrong dashboard.
 *   • If the JWT is present but expired, treat the session as ended and
 *     send the user back to login.
 *
 * The guard subscribes to `storage` events so a logout in another tab
 * also kicks the active tab back to login.
 */

import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { clearSession, isJwtExpired } from "../utils/auth";

/**
 * Roles recognised by the frontend. We accept "user" as an alias for
 * "employee" because the live backend currently issues `role: "user"`
 * for regular staff accounts (e.g. Bob Johnson). Treating it as an
 * employee keeps everyone able to reach their dashboard without
 * requiring a backend migration.
 */
export type AppRole =
  | "platform_admin"
  | "auditor"
  | "owner"
  | "admin"
  | "manager"
  | "hr"
  | "payroll_officer"
  | "employee"
  | "user"
  | "line_manager";

interface RequireAuthProps {
  children: React.ReactNode;
  /** When set, only users whose role is in this list may view the page. */
  requireRoles?: AppRole[];
}

interface CurrentUser {
  role?: AppRole | string;
  [k: string]: unknown;
}

export const normalizeAppRole = (role?: unknown): string => {
  const value = String(role || "").trim().toLowerCase().replace(/[ -]+/g, "_");
  if (value === "hr_manager" || value === "human_resources" || value === "human_resources_manager") return "hr";
  if (value === "line_manager" || value === "linemanager") return "line_manager";
  return value;
};

const readUser = (): CurrentUser | null => {
  try {
    const raw = window.localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as CurrentUser) : null;
  } catch {
    return null;
  }
};

const homeForRole = (role?: string): string => {
  switch (role) {
    case "platform_admin": return "/platform";
    case "auditor":       return "/auditor";
    case "owner":          return "/owner";
    case "admin":
    case "hr":             return "/manager";
    case "manager":
    case "line_manager":   return "/employee";
    case "payroll_officer":
    case "employee":
    case "user":
                   return "/employee";
    default:               return "/employee"; // safest landing for any unexpected role
  }
};

const RequireAuth: React.FC<RequireAuthProps> = ({ children, requireRoles }) => {
  const location = useLocation();
  const [token, setToken] = useState<string | null>(() =>
    typeof window === "undefined" ? null : window.localStorage.getItem("token"),
  );
  const [user, setUser] = useState<CurrentUser | null>(() => readUser());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token") setToken(window.localStorage.getItem("token"));
      if (e.key === "user")  setUser(readUser());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // No token, or expired JWT → clear the stale session and bounce to login.
  if (!token || isJwtExpired(token)) {
    if (typeof window !== "undefined" && token) {
      clearSession();
    }
    return (
      <Navigate
        to="/"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  // Token present but wrong role for this section → bounce to their own home.
  const role = normalizeAppRole(user?.role);
  if (requireRoles && role && !requireRoles.some((allowedRole) => normalizeAppRole(allowedRole) === role)) {
    return <Navigate to={homeForRole(role)} replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
