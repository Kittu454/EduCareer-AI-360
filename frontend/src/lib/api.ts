import { ApiResponse } from '../types';

// Backend listens on port 8000 (see backend/.env PORT). Allow override via env.
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const TOKEN_KEY = 'educareer_token';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// Endpoints that must never trigger a refresh-retry (avoid loops / they set cookies themselves).
const NO_RETRY_ENDPOINTS = new Set(['/auth/refresh', '/auth/login', '/auth/register', '/auth/logout']);

// Exchange the HTTP-only refresh cookie for a fresh access token.
// The refresh token itself is never exposed to JavaScript.
async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = (await res.json().catch(() => null)) as ApiResponse<{ accessToken: string }> | null;
    if (res.ok && json?.success && json.data?.accessToken) {
      setAccessToken(json.data.accessToken);
      return json.data.accessToken;
    }
  } catch {
    // Network failure: treat as logged out.
  }
  setAccessToken(null);
  return null;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const doFetch = async (token: string | null): Promise<{ res: Response; json: ApiResponse<T> | null }> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });
    const json = (await res.json().catch(() => null)) as ApiResponse<T> | null;
    return { res, json };
  };

  try {
    let { res, json } = await doFetch(getAccessToken());

    // Expired/invalid access token: try one silent refresh, then retry once.
    const unauthorized = res.status === 401 && json?.error?.code === 'UNAUTHENTICATED';
    if (unauthorized && !NO_RETRY_ENDPOINTS.has(endpoint) && getAccessToken()) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        ({ res, json } = await doFetch(newToken));
      } else {
        setAccessToken(null);
      }
    } else if (unauthorized) {
      setAccessToken(null);
    }

    return (json ?? {
      success: false,
      data: null as unknown as T,
      error: { code: 'INVALID_RESPONSE', message: 'The server returned an unexpected response.' },
    }) as ApiResponse<T>;
  } catch (err) {
    return {
      success: false,
      data: null as unknown as T,
      error: {
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Failed to connect to backend server.',
      },
    };
  }
}
