import { getFeaturedDrops } from "@/lib/catalog.server";
import { getBrandName } from "@/lib/keyboards";
import { GradientText } from "@/components/ui/GradientText";
import { KeyboardCard } from "@/components/ui/KeyboardCard";

export async function FeaturedDropSection() {
  const drops = await getFeaturedDrops();

  if (drops.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-white/10 bg-bg-surface px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-solana-purple">
            Limited drops
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Featured <GradientText as="span">Keyboard Drops</GradientText>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-text-muted">
            Admin-approved limited editions and special runs — pinned at the top
            with low-supply KeySol tokens when they go live.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {drops.map((drop) => (
            <div key={drop.keyboardId} className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full border border-solana-purple/40 bg-solana-purple/15 px-3 py-1 font-medium text-solana-purple">
                  {drop.token.symbol}
                </span>
                <span className="text-text-muted">
                  {getBrandName(drop.keyboard.brandId)} · max supply{" "}
                  {drop.token.maxSupply.toLocaleString()}
                </span>
              </div>
              <KeyboardCard keyboard={drop.keyboard} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
