import Link from "next/link";
import { getAllKeyboards } from "@/lib/catalog.server";
import { getRankedKeyboards } from "@/lib/rankings";
import { GradientText } from "@/components/ui/GradientText";
import { RankingsPreviewCard } from "./RankingsPreviewCard";

export async function RankingsPreview() {
  const topThree = getRankedKeyboards(await getAllKeyboards(), "speed").slice(0, 3);

  return (
    <section className="border-t border-white/10 bg-bg-surface px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Top <GradientText as="span">Rankings</GradientText>
            </h2>
            <p className="mt-3 max-w-xl text-text-muted">
              The fastest keyboards ranked by speed score — polling rate,
              response time, actuation, and rapid trigger.{" "}
              <Link
                href="/rankings"
                className="text-solana-green underline-offset-2 hover:underline"
              >
                See how scores are calculated
              </Link>
              .
            </p>
          </div>
          <Link
            href="/rankings"
            className="shrink-0 rounded-lg border border-white/10 px-5 py-2.5 text-sm font-medium text-text-primary transition-colors hover:border-solana-purple/40 hover:bg-white/5"
          >
            View full rankings
          </Link>
        </div>

        <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {topThree.map((keyboard) => (
            <RankingsPreviewCard key={keyboard.id} keyboard={keyboard} />
          ))}
        </ol>
      </div>
    </section>
  );
}
