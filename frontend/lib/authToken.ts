import { neon } from './neon';

type TokenResponse = { data?: { token?: string } | null; error?: unknown };

type JwtHeader = { alg?: string; typ?: string };

let cachedToken: { value: string; expMs: number } | null = null;

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
 * Resolve a Neon Managed Auth JWT for Spring Boot (JWKS / EdDSA).
 *
 * Correct endpoint: GET /neondb/auth/token via auth.token()
 * Do NOT call getJWTToken() — that hits /get-jwt-token (404 on Managed Auth).
 * Do NOT send Better Auth session.token (typically HS256).
 */
export async function getAccessToken(): Promise<string | null> {
  if (cachedToken && cachedToken.expMs > Date.now() + 30_000) {
    return cachedToken.value;
  }

  const auth = neon.auth as {
    token?: () => Promise<TokenResponse>;
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

  // 1) Recommended: auth.token() → GET …/auth/token → EdDSA JWT
  try {
    if (typeof auth.token === 'function') {
      const result = await auth.token();
      const jwt = acceptAccessToken(result?.data?.token);
      if (jwt) return jwt;
    }
  } catch {
    // continue
  }

  // 2) getSession + set-auth-jwt response header / access_token field
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
        acceptAccessToken(sessionObj?.accessToken);
      if (fromAccess) return fromAccess;

      // Explicitly ignore session.token when it is HS256
      if (looksLikeJwt(sessionObj?.token) && !isNeonAccessJwt(sessionObj.token)) {
        console.warn(
          '[authToken] Ignoring session.token (not EdDSA). Spring Boot expects Neon Auth JWT from auth.token().'
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
