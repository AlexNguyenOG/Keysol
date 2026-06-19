import type { AvailabilityStatus } from "@/lib/availability/types";
import type { ValueTrend } from "@/lib/tokens/trend";

export type BrandCategory = "gaming" | "enthusiast" | "productivity";

export interface Brand {
  id: string;
  name: string;
  tagline: string;
  category: BrandCategory;
  highlights: string[];
  website?: string;
}

export interface KeyboardStats {
  switchType: string;
  layout: string;
  connectivity: string[];
  actuationPointMm: number;
  keyTravelMm: number;
  pollingRateHz: number;
  responseTimeMs: number;
  rapidTrigger: boolean;
}

export interface Keyboard {
  id: string;
  brandId: string;
  name: string;
  releaseDate: string;
  priceUsd: number;
  stats: KeyboardStats;
  tagline: string;
  image: string;
  purchaseUrl: string;
  badge?: string;
}

export type TokenRarityTier = "legendary" | "rare" | "uncommon";

/** @deprecated Use TokenRarityTier */
export type TokenScarcityTier = TokenRarityTier;

/** Off-chain token metadata. Rarity is catalog baseline; stock is live server data. */
export interface KeyboardToken {
  id: string;
  keyboardId: string;
  symbol: string;
  name: string;
  /** Catalog rarity bucket — how hard this board is to obtain in general. */
  rarityTier: TokenRarityTier;
  /** Catalog rarity score (0–100). Stable; never derived from live stock. */
  rarityScore: number;
  /** Planned max token supply when minted on-chain (tied to catalog rarity). */
  maxSupply: number;
  rationale: string;
  /** Populated after devnet/mainnet mint — not wired to the site yet. */
  mintAddress?: string;
}

/** Server-built view combining catalog rarity with verified retailer stock. */
export interface TokenSnapshot {
  keyboardId: string;
  token: KeyboardToken;
  rarityScore: number;
  rarityTier: TokenRarityTier;
  stockStatus: AvailabilityStatus;
  stockScore: number;
  /** Weighted blend of rarity + stock for ranking (see token scoring). */
  effectiveScore: number;
  /** Effective score from the previous availability refresh cycle. */
  previousEffectiveScore: number | null;
  /** Direction of effective score vs the previous cycle. */
  valueTrend: ValueTrend;
  checkedAt: string | null;
  stockSource: string | null;
  snapshotAt: string;
}
