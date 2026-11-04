# Monthly Budget Calculator

React frontend + Spring Boot API backed by **Neon PostgreSQL**. The UI performs all CRUD through the backend.

## Project Structure

| Path | Description |
| --- | --- |
| `frontend/` | Vite + React UI (API client) |
| `backend-java/` | Spring Boot REST API → Postgres |

## Run both

**Terminal 1 — backend**

```bash
cd backend-java
./gradlew bootRun
```

| URL | Purpose |
| --- | --- |
| http://localhost:8080/api/v1/health | Health |
| http://localhost:8080/swagger-ui/index.html | **Swagger UI** (also `/docs`) |
| http://localhost:8080/v3/api-docs | OpenAPI JSON |

**Terminal 2 — frontend**

```bash
npm install --prefix frontend
npm run dev
```

Open the Vite URL (http://localhost:5173 or http://localhost:5174).

### How the frontend connects

- Dev requests go to `/api/v1/...`
- `frontend/vite.config.ts` proxies `/api` → `http://localhost:8080`
- Optional env: `frontend/.env.development` / `.env.example` (`VITE_BACKEND_ORIGIN`, `VITE_API_BASE_URL`)

## API used by the UI

| Method | Path | UI action |
| --- | --- | --- |
| `GET` | `/api/v1/health` | Boot / connectivity |
| `GET` | `/api/v1/months` | Load all months |
| `GET` | `/api/v1/months/{id}` | Edit / Manage Details |
| `PUT` | `/api/v1/months/{id}` | Save / import month |
| `DELETE` | `/api/v1/months/{id}` | Delete month |
| `GET`/`PUT` | `/api/v1/recurring` | Recurring manager |

## Database tables

`months`, `expense_items`, `category_budgets`, `recurring_expenses`
