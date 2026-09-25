# Tavora

Website + dashboard + till for restaurants in Bangladesh. Single restaurant for now (branches later). See README.md for features, API table and run commands; CHANGELOG.md for what shipped.

## Layout
- `api/` Go (net/http mux), pgx, sqlc, goose migrations embedded and run at boot. Queries in `db/query.sql` → `sqlc generate` → `store/`. Handlers: `api.go` (public), `admin.go` (CMS, VAT, theme), `auth.go` (sessions, PIN, staff), `pos.go` (till, kitchen), `reports.go` (alerts, end of day), `stats.go`, `rules.go` (pricing, VAT, opening hours).
- `web/` SvelteKit 2 + Svelte 5 runes, adapter-node. Public site at `/`, dashboard `/admin`, till `/admin/pos` (client-only, own layout `+layout@.svelte`, offline store `src/lib/offline.svelte.ts`).
- Dashboard building blocks in `web/src/lib/admin/`: `Tabs` (hash-persisted, sliding underline; panels use `hidden` so unsaved edits survive), `Dialog` (all forms open in one), `PageHeader`, `MenuSelect`, `RangePicker`, `TimeRangePicker`, `ColorPicker` + `ColorPanel`. Reuse these before writing new ones. Motion: Svelte `fade`/`fly` with `ms()` from `lib/motion.ts` (zero when reduced motion is on).
- Dashboard and till use a neutral slate palette (overrides on `.shell`/`.pos`); the public site keeps warm cream.
- `mobile/` Expo (React Native) customer app, `App.tsx` + `api.ts`. Shares types, VAT maths, error messages and `Intl` formatters with web through `web/src/lib/shared.ts` (framework-free; `web/src/lib/api.ts` re-exports it). Keep `$env`/`$lib` imports out of `shared.ts` or the mobile bundle breaks. Add packages with `npx expo install`, not `pnpm add`. Build locally (`npx expo run:ios|android`), not EAS.
- `marketing/` SvelteKit static site: one page `/` (hero, features, pricing from `src/lib/pricing.ts`) and docs `/docs` (content in `src/lib/docs.ts`, own layout with search, sidebar, on-this-page). Its design uses the tokens in `marketing/src/app.css` (type scale `--t-*`, spacing `--s1..s9`, PolySans + Geist Mono); icons 16 inline, 20 in buttons, 24 in tiles. Screenshots in `static/shots/*.webp`.

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
- Svelte scopes component CSS with `:where()`, so a scoped `.foo` loses to the admin layout's `main :global(.card)`, `.btn.ghost`, `.row` etc. Add a parent class (`.orders .order`) to win; don't reuse global class names (`.row`, `.small`, `.card`) for something else.
- No left-border accent stripes on cards or notes; use a full thin outline, tint or badge.
- Fonts in `web/`: `--sans` (UI), `--code` (Geist Mono: codes, order numbers, hex), `--display`; `--mono` is display type on the public site, not monospace.

## Working here
- Dev: API on :8080 (`cd api && set -a && . ./.env && set +a && go run .`), web on :5173, marketing on :5180. Local admin: see README (create with `go run . create-admin`).
- Restarting the API: kill only the listener, `kill $(lsof -ti tcp:8080 -sTCP:LISTEN)`. Plain `lsof -ti :8080` also matches the Vite server's connections and kills it.
- Check before commit: `cd api && go vet ./... && go test ./...`, `cd web && npx svelte-check`, same for `marketing`; `cd mobile && pnpm check`. Prettier reformats long lines, so re-read a file before exact-match edits.
- Demo data is marked "(demo)"; remove anything you create for tests.
- Git: author `ebnsina <ebnsina.me@gmail.com>`, no co-author trailers, push straight to `main`. Update CHANGELOG.md with every user-facing change.
- Only change what was asked; don't remove design details nobody mentioned.
