import type { AvailabilityStatus } from "@/lib/availability/types";
import type { KeyboardToken } from "@/types";

export type RarityTier = "legendary" | "rare" | "uncommon" | "common";

/** Lower rank sorts first (Legendary at the top of the dex). */
export const RARITY_TIER_RANK: Record<RarityTier, number> = {
  legendary: 0,
  rare: 1,
  uncommon: 2,
  common: 3,
};

/**
 * Within a tier, prefer boards that are still listed in stock.
 * Higher tiers are meant to feel scarce to claim (tiny supply) while
 * still being boards you can often still buy.
 */
export const STOCK_PREFERENCE_RANK: Record<AvailabilityStatus, number> = {
  in_stock: 0,
  limited: 1,
  unknown: 2,
  out_of_stock: 3,
};

export interface RarityInfo {
  tier: RarityTier;
  label: string;
  /** Short collectible-facing note (no numeric scores). */
  catchHint: string;
  /** Tailwind-friendly border / accent classes for collectible cards. */
  borderClass: string;
  badgeClass: string;
}

/**
 * Map catalog rarityScore + maxSupply to a collectible tier.
 * Featured limited drops (score ~99, supply ~250) land as Legendary.
 * Higher tiers = rarer to claim (tighter supply); stock preference is
 * handled separately when sorting the dex.
 */
export function getRarityTier(
  rarityScore: number,
  maxSupply: number = Number.POSITIVE_INFINITY,
): RarityInfo {
  if (rarityScore >= 95 || maxSupply <= 500) {
    return {
      tier: "legendary",
      label: "Legendary",
      catchHint: "Tiny supply — rarest catch, often still listed in stock",
      borderClass: "border-amber-400/50 shadow-[0_0_0_1px_rgba(251,191,36,0.15)]",
      badgeClass: "border-amber-400/40 bg-amber-400/15 text-amber-200",
    };
  }

  if (rarityScore >= 80 || maxSupply <= 1500) {
    return {
      tier: "rare",
      label: "Rare",
      catchHint: "Limited supply — harder to catch than commons",
      borderClass: "border-solana-purple/45",
      badgeClass: "border-solana-purple/40 bg-solana-purple/15 text-solana-purple",
    };
  }

  if (rarityScore >= 55 || maxSupply <= 4000) {
    return {
      tier: "uncommon",
      label: "Uncommon",
      catchHint: "Moderate supply — easier than rares",
      borderClass: "border-solana-green/35",
      badgeClass: "border-solana-green/35 bg-solana-green/10 text-solana-green",
    };
  }

  return {
    tier: "common",
    label: "Common",
    catchHint: "Wide supply — easiest to catch",
    borderClass: "border-white/15",
    badgeClass: "border-white/15 bg-white/5 text-text-muted",
  };
}

export function getRarityTierForToken(token: KeyboardToken): RarityInfo {
  return getRarityTier(token.rarityScore, token.maxSupply);
}

export function compareCollectibleRarity(
  a: { rarityScore: number; maxSupply: number; stockStatus: AvailabilityStatus },
  b: { rarityScore: number; maxSupply: number; stockStatus: AvailabilityStatus },
): number {
  const tierA = getRarityTier(a.rarityScore, a.maxSupply).tier;
  const tierB = getRarityTier(b.rarityScore, b.maxSupply).tier;
  const byTier = RARITY_TIER_RANK[tierA] - RARITY_TIER_RANK[tierB];
  if (byTier !== 0) {
    return byTier;
  }

  const byStock =
    STOCK_PREFERENCE_RANK[a.stockStatus] - STOCK_PREFERENCE_RANK[b.stockStatus];
  if (byStock !== 0) {
    return byStock;
  }

  // Tighter supply feels rarer within the same tier.
  return a.maxSupply - b.maxSupply;
}
