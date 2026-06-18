import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TokenGuideExplainer } from "@/components/tokens/TokenGuideExplainer";
import { TokenCatalogList } from "@/components/tokens/TokenCatalogList";
import { GradientText } from "@/components/ui/GradientText";

export const metadata: Metadata = {
  title: "Token Guide — KeySol",
  description:
    "How KeySol keyboard tokens work: catalog rarity, live stock scarcity, effective scores, and the full token registry.",
};

export default function TokensPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-widest text-solana-green">
              Collectibles
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Token <GradientText as="span">Guide</GradientText>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-text-muted">
              One token per keyboard — rarity from the catalog, scarcity from
              verified stock. Utility and collectibles, not gambling.
            </p>
          </div>

          <TokenGuideExplainer />
          <TokenCatalogList />
        </div>
      </main>
      <Footer />
    </>
  );
}
