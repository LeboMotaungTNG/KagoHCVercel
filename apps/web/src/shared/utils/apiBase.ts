/**
 * Central API base URL resolver.
 *
 * Order of precedence:
 *   1. `VITE_API_URL` build-time env var (always wins if set).
 *   2. When the app is served from a localhost/127.0.0.1 origin, assume the
 *      local backend on port 4000 (matches `apps/Back-end/.env`).
 *   3. Otherwise fall back to the deployed Heroku API.
 *
 * This exists because different pages previously had different fallbacks
 * (`localhost:3000`, `localhost:4000`, and the Heroku URL). On a Vercel build
 * without `VITE_API_URL` set, the pages defaulting to localhost would try to
 * reach the visitor's own machine and silently fail — which is exactly what
 * broke the platform admin and accept-invite pages in production.
 */

const HEROKU_FALLBACK =
  "https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1";

const LOCAL_FALLBACK = "http://localhost:4000/api/v1";

const isLocalHost = (host: string): boolean =>
  host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";

export const API_BASE: string = (() => {
  const fromEnv = (import.meta as any).env?.VITE_API_URL as string | undefined;
  if (fromEnv && fromEnv.trim().length > 0) return fromEnv;

  if (typeof window !== "undefined" && window.location) {
    return isLocalHost(window.location.hostname) ? LOCAL_FALLBACK : HEROKU_FALLBACK;
  }

  return HEROKU_FALLBACK;
})();
