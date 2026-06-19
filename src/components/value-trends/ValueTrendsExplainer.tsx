import {
  TOKEN_RARITY_WEIGHT,
  TOKEN_STOCK_WEIGHT,
} from "@/lib/tokens/scoring";
import { VALUE_TREND_LABELS } from "@/lib/tokens/trend";

export function ValueTrendsExplainer() {
  return (
    <section className="mb-12 rounded-2xl border border-white/10 bg-bg-surface/80 p-6 sm:p-8">
      <h2 className="text-xl font-semibold text-text-primary sm:text-2xl">
        How value trends work
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-muted sm:text-base">
        Each keyboard token has an{" "}
        <span className="text-text-primary">effective score</span> —{" "}
        {TOKEN_RARITY_WEIGHT * 100}% catalog rarity plus {TOKEN_STOCK_WEIGHT * 100}%
        live retailer stock. Trends compare today&apos;s score to the previous
        stock refresh cycle.
      </p>

      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <li className="rounded-xl border border-solana-green/30 bg-solana-green/10 px-4 py-3">
          <p className="text-sm font-semibold text-solana-green">
            {VALUE_TREND_LABELS.rising}
          </p>
          <p className="mt-1 text-sm text-text-muted">
            Effective score went up — usually because stock got scarcer.
          </p>
        </li>
        <li className="rounded-xl border border-white/15 bg-white/5 px-4 py-3">
          <p className="text-sm font-semibold text-text-muted">
            {VALUE_TREND_LABELS.stable}
          </p>
          <p className="mt-1 text-sm text-text-muted">
            Score unchanged since the last refresh.
          </p>
        </li>
        <li className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3">
          <p className="text-sm font-semibold text-red-400">
            {VALUE_TREND_LABELS.dropping}
          </p>
          <p className="mt-1 text-sm text-text-muted">
            Effective score fell — often because the board is easier to buy now.
          </p>
        </li>
      </ul>
    </section>
  );
}
