# Tavora

Restaurant website with ordering (cash on delivery) and table booking. API first; the web app is one client of it.

- `api/` — Go + PostgreSQL + sqlc. Migrations run on boot.
- `web/` — SvelteKit (Node adapter), renders menu and hours from the API.

## Run locally

```sh
createdb tavora
cd api && cp .env.example .env && set -a && . ./.env && set +a && go run .   # :8080
cd web && cp .env.example .env && pnpm install && pnpm dev                    # :5173
```

Tests: `cd api && go test ./...`

## API

All amounts are integer poisha (৳1 = 100). Errors are always `{"error": {"code", "message", "details"}}`.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/v1/restaurant` | Contact, delivery settings, opening hours (weekday 0 = Sunday) |
| GET | `/v1/menu` | Categories with items |
| POST | `/v1/orders` | Client sends `id` (UUID); retries return the same order. Prices are recomputed server-side. |
| POST | `/v1/reservations` | `date` `YYYY-MM-DD`, `time` `HH:MM` in Asia/Dhaka |

Error codes: `validation_failed`, `bad_request`, `item_not_found`, `item_unavailable`, `restaurant_closed`, `outside_opening_hours`, `not_found`, `internal`.
