import "server-only";

import { getAllKeyboards, getAllKeyboardTokens } from "@/lib/catalog.server";
import type { AvailabilityMap } from "@/lib/availability/types";
import { withMintAddresses } from "@/lib/solana/mints";
import {
  computeEffectiveTokenScore,
  stockScoreFromStatus,
} from "@/lib/tokens/scoring";
import { computeValueTrend } from "@/lib/tokens/trend";
import type { Keyboard, KeyboardToken, TokenSnapshot } from "@/types";

/** Resolve catalog or published drop token by keyboard id. */
export async function resolveKeyboardToken(
  keyboardId: string,
): Promise<KeyboardToken | undefined> {
  const tokens = await getAllKeyboardTokens();
  return tokens.find((token) => token.keyboardId === keyboardId);
}

export async function buildMergedTokenSnapshots(
  availability: AvailabilityMap,
  snapshotAt = new Date().toISOString(),
  previousScores: Record<string, number> = {},
): Promise<TokenSnapshot[]> {
  const tokens = withMintAddresses(await getAllKeyboardTokens());

  return tokens
    .map((token) => {
      const record = availability[token.keyboardId];
      const stockStatus = record?.status ?? "unknown";
      const stockScore = stockScoreFromStatus(stockStatus);
      const effectiveScore = computeEffectiveTokenScore(
        token.rarityScore,
        stockStatus,
      );
      const previousEffectiveScore =
        previousScores[token.keyboardId] ?? null;
      const valueTrend = computeValueTrend(
        effectiveScore,
        previousEffectiveScore ?? undefined,
      );

      return {
        keyboardId: token.keyboardId,
        token,
        rarityScore: token.rarityScore,
        stockStatus,
        stockScore,
        effectiveScore,
        previousEffectiveScore,
        valueTrend,
        checkedAt: record?.checkedAt ?? null,
        stockSource: record?.source ?? null,
        snapshotAt,
      };
    })
    .sort((a, b) => b.effectiveScore - a.effectiveScore);
}

export interface KeyboardWithToken {
  keyboard: Keyboard;
  token: KeyboardToken;
}

export async function getMergedKeyboardsWithTokens(): Promise<
  KeyboardWithToken[]
> {
  const keyboards = await getAllKeyboards();
  const tokens = withMintAddresses(await getAllKeyboardTokens());

  return tokens
    .map((token) => {
      const keyboard = keyboards.find((entry) => entry.id === token.keyboardId);
      if (!keyboard) {
        return null;
      }

      return { keyboard, token };
    })
    .filter((entry): entry is KeyboardWithToken => entry !== null);
}
