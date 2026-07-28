import { API_URL, normalizeEmployeeList, unwrapSuccessData } from '../../../../shared/utils/employee';
import { getSessionUser, type SessionUser } from './session';

export type ResolvedEmployee = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  department?: string;
  position?: string;
  designation?: string;
  employeeCode?: string;
};

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function userKey(user: SessionUser | null): string | undefined {
  if (!user) return undefined;
  return String(user._id || user.id || '').trim() || undefined;
}

function linkedUserId(raw: any): string {
  const u = raw?.userId;
  if (!u) return '';
  if (typeof u === 'object') return String(u._id ?? u.id ?? '').trim();
  return String(u).trim();
}

function mapEmployee(raw: any): ResolvedEmployee | null {
  const id = String(raw?._id ?? raw?.id ?? '').trim();
  if (!id) return null;
  const dept =
    typeof raw?.department === 'object'
      ? String(raw.department?.name ?? '').trim()
      : String(raw?.department ?? '').trim();
  return {
    _id: id,
    firstName: raw?.firstName ?? raw?.first_name,
    lastName: raw?.lastName ?? raw?.last_name,
    email: raw?.email,
    department: dept || undefined,
    position: raw?.position ?? raw?.jobTitle ?? raw?.designation,
    designation: raw?.designation ?? raw?.jobTitle ?? raw?.position,
    employeeCode: raw?.employeeCode ?? raw?.employeeId,
  };
}

/**
 * Resolve the Employee document for the logged-in User.
 * Evaluations require Employee._id (not User._id) — same pattern as leave/profile.
 *
 * Prefer GET /employees/me. Never treat "first row of tenant list" as the current user —
 * GET /employees?userId=… is ignored by the API and returns everyone.
 */
export async function resolveCurrentEmployee(): Promise<ResolvedEmployee | null> {
  const user = getSessionUser();
  const uid = userKey(user);
  const email = String(user?.email ?? '').trim().toLowerCase();
  const headers = authHeaders();

  // 1. Dedicated current-employee endpoint
  try {
    const res = await fetch(`${API_URL}/employees/me`, { headers });
    if (res.ok) {
      const body = await res.json().catch(() => null);
      const data = unwrapSuccessData(body);
      const mapped = mapEmployee(data);
      if (mapped) return mapped;
    }
  } catch {
    /* fall through */
  }

  // 2. Full list — match by linked userId, then email (never pick list[0])
  try {
    const res = await fetch(`${API_URL}/employees`, { headers });
    const body = await res.json().catch(() => null);
    const list = normalizeEmployeeList(body);

    if (uid) {
      const byUser = list.find((emp: any) => linkedUserId(emp) === uid);
      const mapped = mapEmployee(byUser);
      if (mapped) return mapped;
    }

    if (email) {
      const byEmail = list.find(
        (emp: any) => String(emp?.email ?? '').trim().toLowerCase() === email
      );
      const mapped = mapEmployee(byEmail);
      if (mapped) return mapped;
    }
  } catch {
    /* fall through */
  }

  return null;
}
