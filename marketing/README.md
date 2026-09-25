# Tavora marketing site

One product page (hero, features, pricing) and the docs at `/docs`. Static: `pnpm build` writes plain HTML to `build/`.

- Prices: `src/lib/pricing.ts`. Contact and URLs: `.env` (see `.env.example`); the build fails if any is missing.
- Docs: `src/lib/docs.ts`, one guide per dashboard/till screen, in plain words. Wrap button and screen names in backticks; they render in Geist Mono.
- Screenshots: `static/shots/*.webp`, 1280×800, taken from the running app with demo data.

Serve `build/` with any web server; send unknown paths to `404.html`.
