# KeySol — Keyboard Finder

A Solana-themed website for discovering the world's best keyboards. Browse top brands, compare specs, and find your perfect board.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

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
