"use client";

import { TokenGuideExplainer } from "@/components/tokens/TokenGuideExplainer";
import { TokenPolicy } from "@/components/tokens/TokenPolicy";
import { TokenClaimLab } from "@/components/tokens/TokenClaimLab";
import { TokenCollectionBadges } from "@/components/tokens/TokenCollectionBadges";
import { TokenCatalogList } from "@/components/tokens/TokenCatalogList";
import { TokenCollectiblesProvider } from "@/components/tokens/TokenCollectiblesProvider";
import { GradientText } from "@/components/ui/GradientText";

interface TokensPageClientProps {
  tokenizationEnabled: boolean;
  clusterLabel: string;
}

export function TokensPageClient({
  tokenizationEnabled,
  clusterLabel,
}: TokensPageClientProps) {
  return (
    <TokenCollectiblesProvider>
      <div className="mb-12 text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-solana-green">
          Collectibles dex
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Keyboard <GradientText as="span">Collectibles</GradientText>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-text-muted">
          Browse the dex with Legendaries on top. Higher tiers are rarer to
          catch (tighter supply) and are boards that are more often still in
          stock — utility collectibles, not gambling.
          {tokenizationEnabled
            ? ` Free claims are live on ${clusterLabel}.`
            : ""}
        </p>
      </div>

      {tokenizationEnabled ? <TokenCollectionBadges /> : null}
      <TokenCatalogList />
      {tokenizationEnabled ? <TokenClaimLab /> : null}

      <details className="mb-12 rounded-2xl border border-white/10 bg-bg-surface/40 open:pb-2">
        <summary className="cursor-pointer list-none px-6 py-5 text-left sm:px-8">
          <span className="text-xs font-semibold uppercase tracking-widest text-solana-purple">
            How scoring works
          </span>
          <span className="mt-1 block text-lg font-semibold text-text-primary">
            Token guide &amp; effective scores
          </span>
          <span className="mt-1 block text-sm text-text-muted">
            Expand for catalog vs stock scoring, supply caps, and policy.
          </span>
        </summary>
        <div className="border-t border-white/10 px-4 pb-6 pt-2 sm:px-6">
          <TokenGuideExplainer />
          <TokenPolicy />
        </div>
      </details>
    </TokenCollectiblesProvider>
  );
}
