# Tavora

Website, dashboard and till (POS) for restaurants in Bangladesh: online orders with cash on delivery, table bookings, an offline-capable till, staff PINs, end-of-day report and VAT invoices. API first; the web app is one client of it.

- `api/` — Go + PostgreSQL + sqlc. Migrations run on boot.
- `web/` — SvelteKit (Node adapter): the restaurant's website, the dashboard (`/admin`) and the till (`/admin/pos`).
- `marketing/` — SvelteKit (static): a one-page product site (features and pricing) and the docs (`/docs`), with real screenshots in `static/shots/`.

## Run locally

```sh
createdb tavora
cd api && cp .env.example .env && set -a && . ./.env && set +a
go run . create-admin you@example.com "Your Name"   # asks for a password (10+ characters)
go run . seed-demo                                  # optional: 30 days of sample orders and bookings, all marked "(demo)"
go run .                                            # :8080
cd web && cp .env.example .env && pnpm install && pnpm dev   # :5173, dashboard at /admin
cd marketing && cp .env.example .env && pnpm install && pnpm dev   # product site and help
```

Env vars are required; each app refuses to start (or build) without them. API: `DATABASE_URL`, `ADDR`, `CORS_ORIGIN`, `UPLOAD_DIR`. Web: `PUBLIC_API_URL`, `PUBLIC_HELP_URL`. Marketing: `PUBLIC_SITE_URL`, `PUBLIC_WHATSAPP`, `PUBLIC_EMAIL`, `PUBLIC_DEMO_URL`.

Marketing builds to plain files (`pnpm build` → `marketing/build`); serve them with any web server and send unknown paths to `404.html`. Prices live in `marketing/src/lib/pricing.ts`, docs in `marketing/src/lib/docs.ts` (wrap button and screen names in backticks; they render in Geist Mono).

Tests: `cd api && go test ./...`

## Point of sale (`/admin/pos`)

For tablets at the counter and in the kitchen. Tables on the floor screen, tap dishes onto a ticket, send new items to the kitchen, take cash, card, bKash or Nagad (split and tips allowed). Each dish can carry a note for the cook ("no onion"), printed on the kitchen ticket and shown on the kitchen display at `/admin/pos/kitchen`, which lists every ticket with a timer. Every POS write carries an id made on the device, so a retry never doubles a ticket, a kitchen send or a payment.

**Offline:** the POS runs entirely in the browser. A service worker caches the app; the menu, tables and tickets are kept in the tablet's local storage; every change goes into a queue (`web/src/lib/offline.svelte.ts`) that replays in order when the API is reachable. Conflicts the server rejects (for example a table opened on two tablets while one was offline) show under the sync pill. Offline mode needs a production build (`pnpm build && node build`); the dev server doesn't cache its files.

**Staff:** the owner adds staff with a 6-digit PIN under Staff. Staff sign in on the Staff tab of the sign-in page and only reach the POS, orders and bookings (the API refuses the rest with `owner_only`). Every ticket records who opened it, each payment who took it, and each void who did it. Switch staff is blocked while the tablet still has unsynced changes, so sales are never credited to the next person. All PIN attempts share one counter (20 misses per 15 minutes), because the API only sees the web server.

Printing uses the tablet's normal print dialog with 80 mm receipt layouts; pair the tablet with the receipt printer through Android's print service.

## Dashboard (`/admin`)

- **Overview:** revenue, orders and best sellers for any date range, compared with the previous period.
- **Orders:** new orders highlighted, one-tap next step (accept → cooking → ready → on the way → done), a details page per order.
- **Alerts:** every dashboard and POS screen checks for new orders and bookings every 15 s, shows the count in the menu and plays a chime (after the first tap on the page, which browsers require before sound).
- **End of day:** takings by payment method and by staff, tips, discounts, voids, open tickets, and the cash that should be in the drawer.
- **Table bookings:** confirm, decline or cancel; call or WhatsApp the guest; a details page with the guest's other bookings and orders.
- **Menu:** categories and dishes, photos, labels, prices, sold-out switch.
- **Website text:** every piece of homepage copy, reviews, ticker words and icons, story photo, sharing picture.
- **Hours & details:** opening hours per day, contact details, delivery fee and areas, VAT (rate, prices include VAT or not, BIN) and the brand colour.
- **Staff:** add staff with a 6-digit PIN.

**VAT:** off until a rate is set (basis points, 500 = 5%). VAT is on food only, not delivery. Each order stores its own `vat`, `vat_rate` and `vat_inclusive`, so changing the setting never rewrites old bills. With a BIN set, receipts print as a Mushak-6.3 VAT invoice. The rate is the owner's (their accountant's) call; nothing is hard-coded.

**Printing:** receipts and kitchen tickets (`web/src/lib/Slip.svelte`) and the customer's online receipt are moved to the end of `<body>` and printed alone, black on white; the printer's own paper setting picks the width. The end-of-day report prints a separate A4 document, not the screen.

**Brand colour:** stored on the restaurant (`theme`, `#rrggbb`) and applied as `--brand` everywhere. The API refuses colours with less than 4.5:1 contrast against the cream text.

The owner signs in with email and password. The API issues a session token (only its SHA-256 is stored); the web app keeps it in an http-only cookie scoped to `/admin`. Five wrong passwords lock that email for 15 minutes.

Uploaded images are saved to `UPLOAD_DIR` on the API server and served from `/uploads/`.

## API

All amounts are integer poisha (৳1 = 100). Errors are always `{"error": {"code", "message", "details"}}`.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/v1/restaurant` | Contact, delivery settings, opening hours (weekday 0 = Sunday) |
| GET | `/v1/menu` | Categories with items |
| POST | `/v1/orders` | Client sends `id` (UUID); retries return the same order. Prices are recomputed server-side. |
| POST | `/v1/reservations` | `date` `YYYY-MM-DD`, `time` `HH:MM` in Asia/Dhaka |
| GET | `/v1/site` | All homepage copy (shape: `SiteContent` in `api/content.go`) |
| POST | `/v1/admin/login` | Returns a bearer token; everything under `/v1/admin/` needs it |
| POST | `/v1/admin/pin` | Staff sign-in with `{"pin"}`; same token response |
| | `/v1/admin/…` | Owner only: `site`, `restaurant`, `hours`, `categories`, `items`, `stats`, `uploads`, `tables`, `staff`, `reports/day?date=`. Owner and staff: `me`, `alerts`, `orders`, `reservations`, `/v1/pos/…`, `/v1/kitchen` |

Error codes: `validation_failed`, `bad_request`, `item_not_found`, `item_unavailable`, `restaurant_closed`, `outside_opening_hours`, `unauthorized`, `owner_only`, `invalid_credentials`, `wrong_pin`, `too_many_attempts`, `name_taken`, `category_not_empty`, `item_has_orders`, `not_found`, `internal`.
