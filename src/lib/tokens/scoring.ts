import type { AvailabilityStatus } from "@/lib/availability/types";

/**
 * Token stock signals must come from server-side availability checks only.
 * Never mint, rank, or award tokens from client-supplied stock data.
 */
export const TOKEN_STOCK_TRUST_MODEL = "server-verified-availability" as const;

/** Share of effective score from catalog rarity vs live stock (must sum to 1). */
export const TOKEN_RARITY_WEIGHT = 0.6;
export const TOKEN_STOCK_WEIGHT = 0.4;

const STOCK_SCORE: Record<AvailabilityStatus, number> = {
  out_of_stock: 100,
  limited: 85,
  unknown: 50,
  in_stock: 15,
};

/** Stock score lookup for docs and UI (mirrors internal scoring). */
export const TOKEN_STOCK_SCORES = STOCK_SCORE;

export function stockScoreFromStatus(
  status: AvailabilityStatus | undefined,
): number {
  if (!status) {
    return STOCK_SCORE.unknown;
  }

  return STOCK_SCORE[status];
}

export function computeEffectiveTokenScore(
  rarityScore: number,
  stockStatus: AvailabilityStatus | undefined,
): number {
  const stockScore = stockScoreFromStatus(stockStatus);
  const blended =
    rarityScore * TOKEN_RARITY_WEIGHT + stockScore * TOKEN_STOCK_WEIGHT;

  return Math.round(Math.min(100, Math.max(0, blended)));
}
