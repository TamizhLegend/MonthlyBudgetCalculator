/**
 * Frontend → backend connection settings.
 *
 * Dev (Vite): leave VITE_API_BASE_URL unset so requests use `/api/v1`
 * and vite.config.ts proxies them to http://localhost:8080.
 *
 * Production (Vercel): .env.production sets
 *   VITE_API_BASE_URL=https://monthlybudgetcalculator.onrender.com/api/v1
 *   VITE_BACKEND_ORIGIN=https://monthlybudgetcalculator.onrender.com
 *
 * Auth: Neon Auth JWT is attached as Authorization: Bearer on API calls
 * (see lib/authToken.ts + services/monthApi.ts). Spring validates via JWKS.
 */
const trimSlash = (value: string) => value.replace(/\/+$/, '');

export const API_BASE_URL = trimSlash(
  import.meta.env.VITE_API_BASE_URL?.trim() || '/api/v1'
);

/** Absolute backend origin for health / docs links in the UI. */
export const BACKEND_ORIGIN =
  import.meta.env.VITE_BACKEND_ORIGIN?.trim() || 'http://localhost:8080';

export const API_HEALTH_URL = `${BACKEND_ORIGIN}/api/v1/health`;
/** Prefer the concrete index page — `/swagger-ui.html` only redirects. */
export const SWAGGER_UI_URL = `${BACKEND_ORIGIN}/swagger-ui/index.html`;
export const OPENAPI_JSON_URL = `${BACKEND_ORIGIN}/v3/api-docs`;
export const SWAGGER_DOCS_URL = `${BACKEND_ORIGIN}/docs`;
