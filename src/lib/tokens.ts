import { keyboardTokens } from "@/data/keyboard-tokens";
import { keyboards } from "@/data/keyboards";
import type { AvailabilityMap } from "@/lib/availability/types";
import {
  computeEffectiveTokenScore,
  stockScoreFromStatus,
} from "@/lib/tokens/scoring";
import type { Keyboard, KeyboardToken, TokenSnapshot } from "@/types";

export function getKeyboardToken(keyboardId: string): KeyboardToken | undefined {
  return keyboardTokens.find((token) => token.keyboardId === keyboardId);
}

export function getTokenById(tokenId: string): KeyboardToken | undefined {
  return keyboardTokens.find((token) => token.id === tokenId);
}

/** Catalog rarity only — stable ordering without live stock. */
export function getKeyboardTokensByRarity(): KeyboardToken[] {
  return [...keyboardTokens].sort((a, b) => b.rarityScore - a.rarityScore);
}

/** @deprecated Use getKeyboardTokensByRarity */
export function getKeyboardTokensByScarcity(): KeyboardToken[] {
  return getKeyboardTokensByRarity();
}

export function buildTokenSnapshots(
  availability: AvailabilityMap,
  snapshotAt = new Date().toISOString(),
): TokenSnapshot[] {
  return keyboardTokens
    .map((token) => {
      const record = availability[token.keyboardId];
      const stockStatus = record?.status ?? "unknown";
      const stockScore = stockScoreFromStatus(stockStatus);
      const effectiveScore = computeEffectiveTokenScore(
        token.rarityScore,
        stockStatus,
      );

      return {
        keyboardId: token.keyboardId,
        token,
        rarityScore: token.rarityScore,
        rarityTier: token.rarityTier,
        stockStatus,
        stockScore,
        effectiveScore,
        checkedAt: record?.checkedAt ?? null,
        stockSource: record?.source ?? null,
        snapshotAt,
      };
    })
    .sort((a, b) => b.effectiveScore - a.effectiveScore);
}

export function getTokenizedKeyboards(): Keyboard[] {
  const tokenizedIds = new Set(keyboardTokens.map((token) => token.keyboardId));

  return keyboards.filter((keyboard) => tokenizedIds.has(keyboard.id));
}

export interface KeyboardWithToken {
  keyboard: Keyboard;
  token: KeyboardToken;
}

export function getKeyboardsWithTokens(): KeyboardWithToken[] {
  return getKeyboardTokensByRarity()
    .map((token) => {
      const keyboard = keyboards.find((entry) => entry.id === token.keyboardId);
      if (!keyboard) {
        return null;
      }

      return { keyboard, token };
    })
    .filter((entry): entry is KeyboardWithToken => entry !== null);
}

export function isTokenizedKeyboard(keyboardId: string): boolean {
  return keyboardTokens.some((token) => token.keyboardId === keyboardId);
}

/** Whether token UI / wallet flows should render (off by default). */
export function isTokenizationEnabled(): boolean {
  return process.env.NEXT_PUBLIC_TOKENIZATION_ENABLED === "true";
}
