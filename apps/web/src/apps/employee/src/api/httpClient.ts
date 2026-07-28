// src/api/httpClient.ts
//
// Thin fetch wrapper. VITE_API_URL already includes `/api/v1` (same as the rest
// of the app via apiBase). Opt into mocks only with VITE_USE_MOCKS=true.

import { API_BASE } from '../../../../shared/utils/apiBase';

const BASE_URL = API_BASE;

// Live API by default. Set VITE_USE_MOCKS=true for offline mock data.
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

function getToken(): string | null {
  return localStorage.getItem('token');
}

export class ApiError extends Error {
  status: number;
  data?: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
    this.data = data;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || body?.success === false) {
    const message = body?.message || body?.errors?.join(', ') || res.statusText;
    throw new ApiError(res.status, message, body?.data ?? body);
  }

  // Backend envelope is always { success, data }. Unwrap it here so callers
  // in hooks/components just deal with the payload type.
  return (body?.data ?? body) as T;
}

export const http = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
};
