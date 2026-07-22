export interface SessionUser {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  department?: string;
  position?: string;
  [key: string]: unknown;
}

export function getSessionUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function getCurrentUserId(): string {
  const user = getSessionUser();
  return user?._id || user?.id || 'emp-demo';
}

export function getCurrentUserName(): string {
  const user = getSessionUser();
  if (!user) return '';
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
  return name || user.email || '';
}
