# Monthly Budget API (Spring Boot + Gradle + PostgreSQL)

REST API for the React Yearly Expense Sheet app. Data is stored in **Neon PostgreSQL**.

## Run

```bash
./gradlew bootRun
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
