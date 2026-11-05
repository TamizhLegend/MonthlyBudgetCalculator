import { neon } from './neon';

type TokenResponse = { data?: { token?: string } | null; error?: unknown };

function looksLikeJwt(value: string | null | undefined): value is string {
  return Boolean(value && value.split('.').length === 3);
}

/**
 * Resolve a Neon Managed Auth JWT for Spring Boot (JWKS / EdDSA).
 * Prefer `/token` when available; fall back to session.token (set from set-auth-jwt).
 */
export async function getAccessToken(): Promise<string | null> {
  const auth = neon.auth as {
    token?: () => Promise<TokenResponse>;
    getSession?: () => Promise<{ data?: { session?: { token?: string } | null } | null }>;
  };

  try {
    if (typeof auth.token === 'function') {
      const result = await auth.token();
      const token = result?.data?.token;
      if (looksLikeJwt(token)) {
        return token;
      }
    }
  } catch {
    // Fall through to session token
  }

  try {
    if (typeof auth.getSession === 'function') {
      const session = await auth.getSession();
      const token = session?.data?.session?.token;
      if (looksLikeJwt(token)) {
        return token;
      }
    }
  } catch {
    // ignore
  }

  return null;
}
