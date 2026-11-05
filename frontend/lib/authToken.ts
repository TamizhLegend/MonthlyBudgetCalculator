import { neon } from './neon';

type TokenResponse = { data?: { token?: string } | null; error?: unknown };

type JwtHeader = { alg?: string; typ?: string };

let cachedToken: { value: string; expMs: number } | null = null;

function authBaseUrl(): string | null {
  const raw = (import.meta.env.VITE_NEON_AUTH_URL as string | undefined)?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, '');
}

function decodeJwtPart(part: string): unknown {
  const padded = part.replace(/-/g, '+').replace(/_/g, '/');
  const pad = '='.repeat((4 - (padded.length % 4)) % 4);
  return JSON.parse(atob(padded + pad));
}

function looksLikeJwt(value: string | null | undefined): value is string {
  return Boolean(value && value.split('.').length === 3);
}

/** Neon Managed Auth access JWTs are EdDSA; session.token is often HS256 and must not be sent to Spring. */
function isNeonAccessJwt(token: string): boolean {
  try {
    const header = decodeJwtPart(token.split('.')[0]) as JwtHeader;
    const alg = (header.alg || '').toUpperCase();
    return alg === 'EDDSA' || alg === 'ED25519';
  } catch {
    return false;
  }
}

function tokenExpiryMs(token: string): number {
  try {
    const payload = decodeJwtPart(token.split('.')[1]) as { exp?: number };
    if (typeof payload.exp === 'number') {
      return payload.exp * 1000;
    }
  } catch {
    // ignore
  }
  // Neon access tokens last ~15 minutes; refresh a bit early
  return Date.now() + 14 * 60 * 1000;
}

function acceptAccessToken(token: string | null | undefined): string | null {
  if (!looksLikeJwt(token) || !isNeonAccessJwt(token)) {
    return null;
  }
  cachedToken = { value: token, expMs: tokenExpiryMs(token) };
  return token;
}

/**
 * Neon Auth SDK maps `/token` onto the getSession cache hook, so `auth.token()` often
 * returns the cached `{ session, user }` object instead of `{ token }`.
 * Hit the JWT endpoint directly with the session cookie.
 */
async function fetchJwtFromTokenEndpoint(): Promise<string | null> {
  const base = authBaseUrl();
  if (!base) return null;

  try {
    const res = await fetch(`${base}/token`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      console.warn('[authToken] GET /token failed:', res.status, res.statusText);
      return null;
    }
    const body = (await res.json().catch(() => null)) as { token?: string } | null;
    return acceptAccessToken(body?.token);
  } catch (err) {
    console.warn('[authToken] GET /token error:', err);
    return null;
  }
}

/**
 * Resolve a Neon Managed Auth JWT for Spring Boot (JWKS / EdDSA).
 *
 * Prefer a direct GET …/auth/token (avoids neon-js session-cache bug on auth.token()).
 * Do NOT send Better Auth session.token (typically HS256).
 */
export async function getAccessToken(): Promise<string | null> {
  if (cachedToken && cachedToken.expMs > Date.now() + 30_000) {
    return cachedToken.value;
  }

  const fromEndpoint = await fetchJwtFromTokenEndpoint();
  if (fromEndpoint) return fromEndpoint;

  const auth = neon.auth as {
    token?: (opts?: {
      fetchOptions?: { credentials?: RequestCredentials };
    }) => Promise<TokenResponse>;
    getSession?: (opts?: {
      fetchOptions?: {
        credentials?: RequestCredentials;
        onSuccess?: (ctx: { response: Response }) => void;
      };
    }) => Promise<{
      data?: {
        session?: {
          token?: string;
          access_token?: string;
          accessToken?: string;
        } | null;
      } | null;
    }>;
  };

  // Fallback: SDK auth.token() (may be broken by session cache — still try)
  try {
    if (typeof auth.token === 'function') {
      const result = await auth.token({ fetchOptions: { credentials: 'include' } });
      const jwt = acceptAccessToken(result?.data?.token);
      if (jwt) return jwt;
    }
  } catch {
    // continue
  }

  // Fallback: set-auth-jwt on getSession (needs Access-Control-Expose-Headers)
  try {
    if (typeof auth.getSession === 'function') {
      let headerJwt: string | null = null;
      const session = await auth.getSession({
        fetchOptions: {
          credentials: 'include',
          onSuccess: (ctx) => {
            headerJwt =
              ctx.response.headers.get('set-auth-jwt') ||
              ctx.response.headers.get('Set-Auth-Jwt');
          },
        },
      });

      const fromHeader = acceptAccessToken(headerJwt);
      if (fromHeader) return fromHeader;

      const sessionObj = session?.data?.session;
      const fromAccess =
        acceptAccessToken(sessionObj?.access_token) ||
        acceptAccessToken(sessionObj?.accessToken) ||
        acceptAccessToken(sessionObj?.token);
      if (fromAccess) return fromAccess;

      if (looksLikeJwt(sessionObj?.token) && !isNeonAccessJwt(sessionObj.token)) {
        console.warn(
          '[authToken] Ignoring session.token (not EdDSA). Expected JWT from GET /auth/token.'
        );
      }
    }
  } catch {
    // ignore
  }

  cachedToken = null;
  return null;
}

/** Drop cached JWT (e.g. after sign-out or 401). */
export function clearAccessTokenCache(): void {
  cachedToken = null;
}
