import { useEffect, useState } from 'react';

export interface AuthUser {
  id?: string;
  _id?: string;
  role?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  [key: string]: unknown;
}

const readStoredUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());

  useEffect(() => {
    const syncUser = () => setUser(readStoredUser());
    syncUser();

    const onStorage = (event: StorageEvent) => {
      if (event.key === 'user' || event.key === 'token') {
        syncUser();
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return {
    user,
    isAuthenticated: Boolean(localStorage.getItem('token')),
    logout,
  };
};
