import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TokensPageClient } from "@/components/tokens/TokensPageClient";
import { isTokenizationEnabled } from "@/lib/tokens";
import { getClusterLabel } from "@/lib/solana/cluster";

export const metadata: Metadata = {
  title: "Keyboard Collectibles — KeySol",
  description:
    "Browse the KeySol collectibles dex: keyboard tokens with rarity tiers, catch progress, and free claims.",
};

export default function TokensPage() {
  const tokenizationEnabled = isTokenizationEnabled();
  const clusterLabel = getClusterLabel();

  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <TokensPageClient
            tokenizationEnabled={tokenizationEnabled}
            clusterLabel={clusterLabel}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
