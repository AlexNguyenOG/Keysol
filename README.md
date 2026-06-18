# KeySol — Keyboard Finder

A Solana-themed website for discovering the world's best keyboards. Browse top brands, compare specs, and find your perfect board.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Deploying on Vercel

1. **Production branch** — In Vercel → Project → Settings → Git, set **Production Branch** to the branch you push (e.g. `main` or your feature branch). Redeploy after merging latest changes.
2. **Environment variable** — Add `AVAILABILITY_CRON_SECRET` (or Vercel’s auto-generated `CRON_SECRET`) with `openssl rand -hex 32`. Vercel Cron calls `/api/availability/refresh` every 6 hours with `Authorization: Bearer …`.
3. **Stock data** — Production reads `src/data/availability.snapshot.json` bundled with each deploy. Refresh locally before pushing:
   ```bash
   npm run availability:snapshot
   git add src/data/availability.snapshot.json && git commit -m "chore: refresh availability snapshot"
   ```
   GitHub Actions also updates the snapshot every 6 hours on `main`.

If every keyboard shows **Unknown** stock, the deploy is missing the snapshot file or is running an old build without the latest catalog.

## Verification

Run the full regression suite before pushing:

```bash
npm run check        # lint + unit tests + production build
npm run test:e2e     # browser smoke tests (prod server on port 3100)
```

CI runs the same checks on every push and pull request to `main`.

## Tech Stack

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**

## Roadmap

1. Rankings page — sort keyboards by score, price, switch type
2. Brand detail pages — `/brands/wooting` with keyboard list
3. Keyboard detail pages — specs, pros/cons, affiliate links
4. Search + filters — client-side first, then URL-driven filters
5. Comparison tool — side-by-side 2–3 keyboards
6. Performance — static generation, image optimization, optional CMS

## Project Structure

```
src/
├── app/           # Pages and layout
├── components/    # UI, layout, and home sections
├── data/          # Brand and keyboard data
└── types/         # Shared TypeScript interfaces
```
