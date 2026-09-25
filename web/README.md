# Tavora web

The restaurant's website (`/`), dashboard (`/admin`) and till (`/admin/pos`). See the root `README.md` and `CLAUDE.md`.

```sh
cp .env.example .env && pnpm install && pnpm dev   # :5173
pnpm build && node build                           # production; needed for the till's offline mode
```
