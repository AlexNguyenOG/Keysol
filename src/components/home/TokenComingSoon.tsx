import Link from "next/link";
import { getKeyboardTokensByRarity } from "@/lib/tokens";
import { GradientText } from "@/components/ui/GradientText";

const previewSymbols = getKeyboardTokensByRarity()
  .slice(0, 4)
  .map((token) => token.symbol);

export function TokenComingSoon() {
  return (
    <section
      aria-label="Tokens coming soon"
      className="border-t border-white/10 bg-bg-surface/40 px-4 py-16 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="gradient-border flex flex-col gap-6 rounded-2xl p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-solana-green sm:text-base">
              Coming soon
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Keyboard{" "}
              <GradientText as="span">token collectibles</GradientText>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-text-muted sm:text-lg">
              One token per catalog keyboard — catalog score from the board itself,
              scarcity from live stock checks. Utility and collectibles, not gambling.
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-4 sm:items-end">
            <div className="flex flex-wrap gap-2">
              {previewSymbols.map((symbol) => (
                <span
                  key={symbol}
                  className="rounded-md border border-white/10 bg-bg-primary/60 px-3 py-1.5 font-mono text-sm text-solana-purple sm:text-base"
                >
                  {symbol}
                </span>
              ))}
            </div>
            <span className="rounded-full border border-solana-purple/40 bg-solana-purple/15 px-5 py-2 text-base font-semibold text-solana-purple sm:text-lg">
              Tokens launching soon
            </span>
            <Link
              href="/tokens"
              className="text-sm font-medium text-solana-green transition-colors hover:text-text-primary sm:text-base"
            >
              Read the token guide →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
