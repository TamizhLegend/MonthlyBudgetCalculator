import { createClient } from '@neondatabase/neon-js';
import { BetterAuthReactAdapter } from '@neondatabase/neon-js/auth/react/adapters';

const authUrl = import.meta.env.VITE_NEON_AUTH_URL as string | undefined;

if (!authUrl) {
  console.warn(
    'VITE_NEON_AUTH_URL is not set. Add it to frontend/.env.development (Neon Auth URL from the console).'
  );
}

/** Derive Data API URL from Neon Auth URL (required by createClient; app data still uses Spring Boot). */
function deriveDataApiUrl(neonAuthUrl: string): string {
  return neonAuthUrl.replace('.neonauth.', '.apirest.').replace(/\/auth\/?$/, '/rest/v1');
}

/**
 * credentials: 'include' is required for cross-origin setups
 * (Vercel → neonauth.*.neon.tech) so authClient.token() can read the session cookie
 * and return an EdDSA JWT for the Spring Boot API.
 */
export const neon = createClient({
  auth: {
    url: authUrl || 'http://localhost/missing-neon-auth-url',
    adapter: BetterAuthReactAdapter({
      fetchOptions: {
        credentials: 'include',
      },
    }),
  },
  dataApi: {
    url:
      import.meta.env.VITE_NEON_DATA_API_URL ||
      (authUrl ? deriveDataApiUrl(authUrl) : 'http://localhost/missing-data-api'),
  },
});
