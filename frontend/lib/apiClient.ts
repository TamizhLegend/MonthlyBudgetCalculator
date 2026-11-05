import { API_BASE_URL } from '../config/apiConfig';
import { clearAccessTokenCache, getAccessToken } from './authToken';

function mergeHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  return headers;
}

async function withBearer(extra?: HeadersInit): Promise<Headers> {
  const headers = mergeHeaders(extra);
  const token = await getAccessToken();
  if (!token) {
    throw new Error(
      'Missing Neon Auth JWT — could not obtain an EdDSA access token from /auth/token. Sign in again or check VITE_NEON_AUTH_URL / trusted origins.'
    );
  }
  headers.set('Authorization', `Bearer ${token}`);
  return headers;
}

/**
 * Authenticated fetch for the Spring Boot API.
 * Always sends `Authorization: Bearer <Neon EdDSA JWT>`.
 * On 401, clears the token cache, refreshes once, and retries.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = await withBearer(init?.headers);

  const res = await fetch(url, {
    ...init,
    headers,
  });

  if (res.status !== 401) {
    return res;
  }

  // Token may have expired mid-session — refresh and retry once
  clearAccessTokenCache();
  const retryHeaders = await withBearer(init?.headers);
  return fetch(url, {
    ...init,
    headers: retryHeaders,
  });
}
