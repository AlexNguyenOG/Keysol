import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RankingsList } from "@/components/rankings/RankingsList";
import { SpeedScoreExplainer } from "@/components/rankings/SpeedScoreExplainer";
import { GradientText } from "@/components/ui/GradientText";
import { getAllKeyboards } from "@/lib/catalog.server";

export const metadata: Metadata = {
  title: "Keyboard Rankings — KeySol",
  description:
    "Ranked list of the fastest gaming and enthusiast keyboards by speed score, price, and release date.",
};

export default async function RankingsPage() {
  const catalogKeyboards = await getAllKeyboards();

  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-widest text-solana-green">
              Leaderboard
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Keyboard <GradientText as="span">Rankings</GradientText>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-text-muted">
              Sorted by a composite speed score using polling rate, response
              time, actuation point, and rapid trigger support. Switch sorting
              to compare by price or release date.
            </p>
          </div>

          <SpeedScoreExplainer />
          <RankingsList catalogKeyboards={catalogKeyboards} />
        </div>
      </main>
      <Footer />
    </>
  );
}
