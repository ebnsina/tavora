# Tavora

Website + dashboard + till for restaurants in Bangladesh. Single restaurant for now (branches later). See README.md for features, API table and run commands; CHANGELOG.md for what shipped.

## Layout
- `api/` Go (net/http mux), pgx, sqlc, goose migrations embedded and run at boot. Queries in `db/query.sql` → `sqlc generate` → `store/`. Handlers: `api.go` (public), `admin.go` (CMS, VAT, theme), `auth.go` (sessions, PIN, staff), `pos.go` (till, kitchen), `reports.go` (alerts, end of day), `stats.go`, `rules.go` (pricing, VAT, opening hours).
- `web/` SvelteKit 2 + Svelte 5 runes, adapter-node. Public site at `/`, dashboard `/admin`, till `/admin/pos` (client-only, own layout `+layout@.svelte`, offline store `src/lib/offline.svelte.ts`).
- `marketing/` SvelteKit static site: home, features, pricing (`src/lib/pricing.ts`), help (`src/lib/docs.ts`). Screenshots in `static/shots/*.webp`.

## Rules that bite
- Money is integer poisha (৳1 = 100). VAT rate is basis points. Format with `Intl` only.
- Every till write carries a device-made UUID; the server must stay idempotent on retry.
- Orders snapshot VAT (`vat`, `vat_rate`, `vat_inclusive`) and line prices; never recompute old orders from current settings.
- VAT maths exists twice and must match: `vatOn` in `api/rules.go` and `web/src/lib/api.ts` (half-up rounding). Tests in `api/pin_test.go`.
- Roles: `owner` vs `staff`. Owner-only routes use `owner(...)` in `api/main.go`; staff pages are whitelisted in `web/src/routes/admin/+layout.server.ts`. Add new routes to the right list.
- Errors: API returns stable `code`s; web maps them to plain words in `lib/api.ts` `message()`. Never show raw backend text.
- Env vars are required and checked at boot; no defaults for config.
- Offline mode and the service worker only work in a production build, not `pnpm dev`.
- Print layouts: portal the printable node to `<body>` (`lib/portal.ts`) and hide `body > *:not(.x)`; don't use `size: 80mm auto` (invalid).
- User-facing copy is plain language, no jargon. Icons are Hugeicons (free set only; check the name exists).

## Working here
- Dev: API on :8080 (`cd api && set -a && . ./.env && set +a && go run .`), web on :5173, marketing on :5180. Local admin: see README (create with `go run . create-admin`).
- Restarting the API: kill only the listener, `kill $(lsof -ti tcp:8080 -sTCP:LISTEN)`. Plain `lsof -ti :8080` also matches the Vite server's connections and kills it.
- Check before commit: `cd api && go vet ./... && go test ./...`, `cd web && npx svelte-check`, same for `marketing`. Prettier reformats long lines, so re-read a file before exact-match edits.
- Demo data is marked "(demo)"; remove anything you create for tests.
- Git: author `ebnsina <ebnsina.me@gmail.com>`, no co-author trailers, push straight to `main`. Update CHANGELOG.md with every user-facing change.
- Only change what was asked; don't remove design details nobody mentioned.
