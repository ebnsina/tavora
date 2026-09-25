# Changelog

## Unreleased

### Website
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
