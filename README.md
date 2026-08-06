# KeySol — Keyboard Finder

A Solana-themed website for discovering the world's best keyboards. Browse top brands, compare specs, track live retailer stock, and collect optional keyboard tokens.

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

### Shipped
1. Rankings page — speed score leaderboard with search, layout, rapid-trigger, and stock filters
2. Live retailer stock badges + availability snapshot / cron refresh
3. Collectibles dex — rarity tiers, wallet claims (Devnet / simulation)
4. Limited-edition drop radar (admin approve → featured home)
5. Value Trends — catalog score blended with live stock signals
6. Solana × Thock King collab page

### Next
1. Brand detail pages — `/brands/wooting` with keyboard list
2. Keyboard detail pages — specs, pros/cons, affiliate links
3. URL-driven filters + shareable ranking queries
4. Comparison tool — side-by-side 2–3 keyboards
5. Stock alerts for limited editions
6. Performance — static generation, image optimization, optional CMS

## Project Structure

```
src/
├── app/           # Pages and layout
├── components/    # UI, layout, and home sections
├── data/          # Brand and keyboard data
└── types/         # Shared TypeScript interfaces
```
