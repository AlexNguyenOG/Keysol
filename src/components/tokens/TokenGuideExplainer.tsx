import {
  TOKEN_RARITY_WEIGHT,
  TOKEN_STOCK_SCORES,
  TOKEN_STOCK_TRUST_MODEL,
  TOKEN_STOCK_WEIGHT,
} from "@/lib/tokens/scoring";
import { AVAILABILITY_LABELS } from "@/lib/availability/labels";
import type { AvailabilityStatus } from "@/lib/availability/types";
import Link from "next/link";

const stockStatuses: AvailabilityStatus[] = [
  "out_of_stock",
  "limited",
  "unknown",
  "in_stock",
];

const principles = [
  {
    title: "One token per keyboard",
    body: "Every board in the KeySol catalog maps to exactly one collectible token — same symbol, same keyboard, forever.",
  },
  {
    title: "Catalog score is stable",
    body: "Each token has a fixed catalog baseline that reflects how hard the board is to obtain in general. It does not change when retailer stock flips.",
  },
  {
    title: "Live stock adds scarcity",
    body: "Retailer availability is checked server-side and blended into an effective score. Out-of-stock boards score higher on scarcity; easy-to-buy boards score lower.",
  },
  {
    title: "Utility, not gambling",
    body: "Tokens are collectibles tied to real keyboards and verified stock — not loot boxes, not wagers, and not pay-to-win mechanics.",
  },
];

export function TokenGuideExplainer() {
  return (
    <section className="mb-12 space-y-8">
      <div className="rounded-2xl border border-white/10 bg-bg-surface/80 p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-text-primary sm:text-2xl">
          What are KeySol tokens?
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-muted sm:text-base">
          KeySol tokens are keyboard collectibles — one per catalog board. Each
          token carries a{" "}
          <span className="text-text-primary">catalog score</span> (how hard the
          keyboard is to obtain in general) and an{" "}
          <span className="text-text-primary">effective score</span> that blends
          that baseline with live retailer stock. Minting and wallet flows are
          coming soon; this guide documents how tokens are ranked today. Track
          live movers on the{" "}
          <Link
            href="/value-trends"
            className="text-solana-green underline-offset-2 hover:underline"
          >
            Value Trends
          </Link>{" "}
          page.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {principles.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-white/10 bg-bg-primary/50 p-4"
            >
              <h3 className="font-medium text-text-primary">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-bg-surface/80 p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-text-primary sm:text-2xl">
          How effective scores work
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-muted sm:text-base">
          Effective score combines the catalog baseline and live stock on a 0–100
          scale. The catalog score carries most of the weight because it reflects
          long-term scarcity; stock nudges the score when availability changes.
        </p>

        <div className="mt-6 rounded-xl border border-solana-purple/30 bg-solana-purple/10 p-4 font-mono text-sm text-text-primary sm:text-base">
          effective = round(
          {TOKEN_RARITY_WEIGHT * 100}% × catalog + {TOKEN_STOCK_WEIGHT * 100}%
          × stock)
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-bg-primary/50 p-4">
            <h3 className="font-medium text-text-primary">Catalog score</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              Set per keyboard when the token registry is authored. Higher means
              harder to source — batch drops, flagship pricing, chronic
              sellouts. Range is 0–100.
            </p>
            <p className="mt-3 text-xs text-text-muted">
              Weight: {TOKEN_RARITY_WEIGHT * 100}% of effective score
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-bg-primary/50 p-4">
            <h3 className="font-medium text-text-primary">Live stock score</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              Derived from server-verified retailer checks (same pipeline as
              KeySol availability badges). Scarcer stock → higher stock score.
            </p>
            <p className="mt-3 text-xs text-text-muted">
              Weight: {TOKEN_STOCK_WEIGHT * 100}% · Trust model:{" "}
              <span className="font-mono text-solana-green">
                {TOKEN_STOCK_TRUST_MODEL}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-8 overflow-x-auto rounded-xl border border-white/10 bg-bg-primary/40">
          <table className="min-w-full text-left text-sm">
            <caption className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
              Stock score by availability
            </caption>
            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Retailer status</th>
                <th className="px-4 py-3 font-medium">Stock score</th>
                <th className="px-4 py-3 font-medium">Effect on token</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-text-muted">
              {stockStatuses.map((status) => (
                <tr key={status}>
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {AVAILABILITY_LABELS[status]}
                  </td>
                  <td className="px-4 py-3 font-mono text-solana-purple">
                    {TOKEN_STOCK_SCORES[status]}
                  </td>
                  <td className="px-4 py-3">
                    {status === "out_of_stock" && "Boosts effective score most"}
                    {status === "limited" && "Moderate scarcity boost"}
                    {status === "unknown" && "Neutral until verified"}
                    {status === "in_stock" && "Lowers effective score"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-bg-surface/80 p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-text-primary sm:text-2xl">
          Max supply
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-muted sm:text-base">
          Each token has a planned max supply for future on-chain minting —
          the cap on how many people can ever hold that collectible. Supply
          stays fixed; effective scores can still shift when retailer stock
          changes.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-solana-purple/30 bg-solana-purple/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-solana-purple">
              Tight caps
            </p>
            <p className="mt-2 text-sm text-text-muted">
              Scarcer boards use lower max supply (around 500) so fewer tokens
              can exist.
            </p>
          </div>
          <div className="rounded-xl border border-solana-green/30 bg-solana-green/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-solana-green">
              Mid caps
            </p>
            <p className="mt-2 text-sm text-text-muted">
              Mid-tier boards land around 1.5k–3k max supply.
            </p>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Wider caps
            </p>
            <p className="mt-2 text-sm text-text-muted">
              Boards that are easy to find in retail get wider supply for the
              collectible.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-white/10 bg-bg-primary/50 p-4">
          <h3 className="font-medium text-text-primary">Before mint goes live</h3>
          <ul className="mt-3 space-y-2 text-sm text-text-muted">
            <li>
              Tokens exist as an off-chain registry today — symbols, catalog
              scores, and rationale are public; mint addresses are added when
              Solana deployment ships.
            </li>
            <li>
              Stock data is never accepted from the browser. Snapshots are built
              on the server from the same availability cache that powers buy links.
            </li>
            <li>
              Collecting will mean owning a token tied to a keyboard you care
              about — not random rolls or speculative packs. See the{" "}
              <a
                href="#token-policy-title"
                className="text-solana-green underline-offset-2 hover:underline"
              >
                Token policy
              </a>{" "}
              for ownership rules and the mint checklist.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
