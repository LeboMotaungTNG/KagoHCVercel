// src/api/httpClient.ts
//
// Thin fetch wrapper. Reads VITE_API_URL exactly as specified in the handoff
// ("Base URL: VITE_API_URL/api/v1"). Set VITE_USE_MOCKS=true in .env.local to
// build every screen against the mock data in src/mocks/ before Stage 3
// (evaluation controllers) lands on the backend.

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/v1`;

// Default to mocks until backend evaluation endpoints are live.
// Set VITE_USE_MOCKS=false in production when APIs are ready.
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';

function getToken(): string | null {
  return localStorage.getItem('token');
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
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
    throw new ApiError(res.status, message);
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
