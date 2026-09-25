# Changelog

## Unreleased

### Dashboard
- Revenue by day has Chart and Table tabs; the table lists orders, revenue and average order per day with a total row.
- Order details page: every dish, totals, discount, customer, table, and each payment with method, time, reference and tip. Open it by tapping an order number.
- Point of sale has its own button at the top of the sidebar.
- Overview shows the current date and time on the right of the greeting.

### Website
- Open or closed now shows on a sign hanging over the shop door, with today's closing or next opening time, instead of a badge above the shop.
- Story section: the spinning name rings are separated by stars, alternate black and red, and no longer overlap where they join; the dish photo is bigger with a plate rim.
- The "Hot. Fresh. Yours." slogan on the building is now in capitals.

### Point of sale
- Works without internet: tickets, kitchen sends, payments and voids are saved on the tablet and sent in order when the connection returns, never twice.
- Sync status in the POS top bar ("All saved", "No internet · 3 waiting", "Syncing") and a list of anything the server rejected, such as two tablets opening the same table.
- Bills and kitchen tickets print straight from the tablet, so printing works offline too.
- The POS app is cached on the tablet and reopens offline, even after a reload.
- Floor screen with every table and its open bill, time seated and dishes not yet sent to the kitchen.
- Ticket screen: tap-to-add menu with search and categories, running bill, discount, void.
- Send to kitchen sends only what the kitchen doesn't have yet and prints a kitchen ticket; sent dishes can't be quietly reduced.
- Payments by cash (with change), card, bKash or Nagad (with transaction ID), split into several payments, with tips.
- Kitchen display with timers that turn yellow at 10 and red at 20 minutes; accepted online orders show up there too.
- 80 mm printouts for kitchen tickets and customer bills.
- Tables page in the dashboard; the overview splits orders into delivery, pickup and dine-in.

### Dashboard
- Overview page: greeting, date range (today, 7, 30, 90 days or custom), revenue, orders, average order and cancellations against the previous period, revenue-by-day chart, best sellers, delivery vs pickup, open orders and next bookings.
- Grouped sidebar, account menu, and page headers with the main actions on the right.
- Brand-styled checkboxes, radio buttons, switches, selects, and custom date and time pickers.
- Website text editor split into tabs, one per homepage section.
- Orders open on active orders by default.
- Links that leave the dashboard show an outward arrow.
- Owner dashboard at `/admin` with email and password sign-in.
- Orders board: new orders highlighted, one-tap status steps, auto-refresh.
- Table bookings: confirm, decline or cancel requests.
- Menu editor: add, rename and delete categories; add, edit and delete dishes with photos; sold-out switch.
- Website text editor: every homepage heading, slogan, story, sticker, review, ticker word and icon, and sharing picture.
- Opening hours and restaurant details, including delivery fee, free-delivery threshold and delivery areas.

### Website
- All homepage content now comes from the database, so it can be changed without a code update.
- Poster-style design in red, cream and black with mango-yellow accents; PolySans throughout.
- Hero with the shopfront illustration; fast food leads the copy and the menu.
- Most-loved dish rail, spinning name rings, full menu with sticky categories and sold-out states.
- Fill-in-the-blank table booking with a ticket-style confirmation.
- Cart, checkout and a printed-receipt confirmation; cash on delivery or pay at pickup.
- Live "Open now / Closed now" status in the hero; the cart explains when ordering reopens and locks checkout while closed.
- Round food photos over a scrolling "Fresh off the tawa" line, drifting review cards, crossing ticker bands.
- Corner-shop building with bunting, lit windows, neon OPEN sign and a large Call the kitchen button.
- Footer with equal columns and an edge-to-edge wordmark.
- In-page links scroll smoothly without adding `#section` to the address bar.

### API
- `GET /v1/restaurant` and `GET /v1/menu` serve contact details, delivery settings, opening hours and the menu from PostgreSQL.
- `POST /v1/orders` saves cash-on-delivery and pickup orders; prices are recalculated on the server and retries never create duplicates.
- `POST /v1/reservations` saves table requests within opening hours.
- Orders are refused outside opening hours with a clear error code.
