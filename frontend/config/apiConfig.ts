/**
 * Frontend → backend connection settings.
 *
 * Dev (Vite): leave VITE_API_BASE_URL unset so requests use `/api/v1`
 * and vite.config.ts proxies them to http://localhost:8080.
 *
 * Direct (no proxy): set VITE_API_BASE_URL=http://localhost:8080/api/v1
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
