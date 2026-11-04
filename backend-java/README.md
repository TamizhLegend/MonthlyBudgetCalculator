# Monthly Budget API (Spring Boot + Gradle + PostgreSQL)

REST API for the React Yearly Expense Sheet app. Data is stored in **Neon PostgreSQL**.

## Run

```bash
./gradlew bootRun
```

## Deploy on Render (Docker)

1. Create a **Web Service** → connect this repo.
2. Set **Root Directory** to `backend-java`.
3. **Runtime**: Docker (uses `Dockerfile`).
4. Environment variables (recommended):

| Variable | Example |
| --- | --- |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://...neon.tech:5432/neondb?sslmode=require&prepareThreshold=0` |
| `SPRING_DATASOURCE_USERNAME` | Neon role |
| `SPRING_DATASOURCE_PASSWORD` | Neon password |
| `CORS_ALLOWED_ORIGINS` | `https://your-frontend.netlify.app,http://localhost:5173` |

Render sets `PORT` automatically; the app listens on `${PORT}`.

Health check path: `/api/v1/health`

Local image smoke test:

```bash
docker build -t budget-api .
docker run --rm -p 8080:8080 -e PORT=8080 budget-api
```

| URL | Purpose |
| --- | --- |
| http://localhost:8080/api/v1/health | Health |
| http://localhost:8080/swagger-ui/index.html | Swagger UI (also http://localhost:8080/docs) |
| http://localhost:8080/v3/api-docs | OpenAPI JSON |

Swagger docs describe:
- **Months** — CRUD matching `MonthExpenseData`
- **Recurring** — list replace matching `RecurringExpense`
- **Category Limits** — default per-category budget caps (`CategoryLimit`)
- **Health** — used by the frontend boot check

Server URL in Swagger defaults to `http://localhost:8080` so **Try it out** hits this API.

## Frontend wiring

The Vite app proxies `/api` → this server. Keep both running:

```bash
# backend
./gradlew bootRun

# frontend (repo root)
npm run dev
```

## Schema

| Table | Purpose |
| --- | --- |
| `months` | Month sheet (`id` = `YYYY-MM`) |
| `expense_items` | Line items |
| `category_budgets` | Per-month category caps |
| `category_limits` | Global default category caps (applied to months on demand) |
| `recurring_expenses` | Recurring templates |

Hibernate `ddl-auto: update` creates/updates tables on startup.
