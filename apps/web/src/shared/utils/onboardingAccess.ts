// Who may onboard employees: the owner, admins and HR — the same roles the
// server accepts (POST /onboarding/process-bulk, /employees/create-with-onboarding).
// Used to hide "Add" buttons and guard the onboarding page, so nobody fills in
// a form the server will refuse.
import { normalizeAppRole } from "../components/RequireAuth";

export const ONBOARDING_ROLES = ["owner", "admin", "hr", "hr_manager"] as const;

export function currentAppRole(): string {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return normalizeAppRole(user?.role);
  } catch {
    return "";
  }
}

export const canOnboardEmployees = (role: string = currentAppRole()): boolean =>
  (ONBOARDING_ROLES as readonly string[]).includes(role);

/** A clear message from a failed onboarding request (never just "try again"). */
export async function onboardingErrorMessage(res: Response): Promise<string> {
  const body = await res.json().catch(() => ({} as any));
  if (res.status === 403) return "Only the owner, admins and HR can onboard employees. Ask HR to add this person.";
  const first = body?.errors?.[0]?.error || body?.errors?.[0]?.message || body?.data?.errors?.[0]?.error;
  return body?.message ? `${body.message}${first && first !== body.message ? ` — ${first}` : ""}` : `The server refused the request (HTTP ${res.status}).`;
}
