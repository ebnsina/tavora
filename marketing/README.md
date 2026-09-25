# Tavora marketing site

Product pages (home, features, pricing) and the help centre. Static: `pnpm build` writes plain HTML to `build/`.

- Prices: `src/lib/pricing.ts`. Contact and URLs: `.env` (see `.env.example`); the build fails if any is missing.
- Help guides: `src/lib/docs.ts`, one per dashboard/till screen. Keep them in plain words and in step with the app.
- Screenshots: `static/shots/*.webp`, 1280×800, taken from the running app with demo data.

Serve `build/` with any web server; send unknown paths to `404.html`.
