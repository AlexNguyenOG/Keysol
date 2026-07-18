import { describe, expect, it } from "vitest";
import { keyboards } from "@/data/keyboards";
import { keyboardTokens } from "@/data/keyboard-tokens";
import {
  buildTokenSnapshots,
  getKeyboardToken,
  getKeyboardTokensByRarity,
  getKeyboardsWithTokens,
  isTokenizedKeyboard,
} from "@/lib/tokens";
import {
  computeEffectiveTokenScore,
  stockScoreFromStatus,
  TOKEN_RARITY_WEIGHT,
  TOKEN_STOCK_WEIGHT,
} from "@/lib/tokens/scoring";
import { computeValueTrend } from "@/lib/tokens/trend";

describe("keyboard tokens", () => {
  it("has unique token and keyboard ids", () => {
    const tokenIds = keyboardTokens.map((token) => token.id);
    const keyboardIds = keyboardTokens.map((token) => token.keyboardId);
    const symbols = keyboardTokens.map((token) => token.symbol);

    expect(new Set(tokenIds).size).toBe(tokenIds.length);
    expect(new Set(keyboardIds).size).toBe(keyboardIds.length);
    expect(new Set(symbols).size).toBe(symbols.length);
  });

  it("covers every catalog keyboard exactly once", () => {
    const catalogIds = keyboards.map((keyboard) => keyboard.id).sort();
    const tokenKeyboardIds = keyboardTokens
      .map((token) => token.keyboardId)
      .sort();

    expect(tokenKeyboardIds).toEqual(catalogIds);
    expect(keyboardTokens).toHaveLength(keyboards.length);
  });

  it("uses positive catalog scores and supply", () => {
    for (const token of keyboardTokens) {
      expect(token.rarityScore).toBeGreaterThan(0);
      expect(token.maxSupply).toBeGreaterThan(0);
      expect(token.rationale.length).toBeGreaterThan(10);
    }
  });

  it("sorts by catalog score", () => {
    const sorted = getKeyboardTokensByRarity();
    const scores = sorted.map((token) => token.rarityScore);

    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(sorted[0]?.keyboardId).toBe("wooting-60he-plus");
  });

  it("pairs tokens with keyboard records", () => {
    const pairs = getKeyboardsWithTokens();

    expect(pairs).toHaveLength(keyboardTokens.length);
    expect(pairs.every((pair) => pair.token.keyboardId === pair.keyboard.id)).toBe(
      true,
    );
  });

  it("looks up tokens by keyboard id", () => {
    expect(isTokenizedKeyboard("wooting-60he-plus")).toBe(true);
    expect(isTokenizedKeyboard("not-a-real-keyboard")).toBe(false);
    expect(getKeyboardToken("wooting-60he-plus")?.symbol).toBe("KSOL-W60HE");
    expect(getKeyboardToken("corsair-k70-rgb-mk2")?.symbol).toBe("KSOL-K70MK2");
  });
});

describe("token scoring", () => {
  it("maps stock status to deterministic scores", () => {
    expect(stockScoreFromStatus("out_of_stock")).toBe(100);
    expect(stockScoreFromStatus("limited")).toBe(85);
    expect(stockScoreFromStatus("in_stock")).toBe(15);
    expect(stockScoreFromStatus(undefined)).toBe(50);
  });

  it("labels value trend from effective score delta", () => {
    expect(computeValueTrend(80, 70)).toBe("rising");
    expect(computeValueTrend(70, 70)).toBe("stable");
    expect(computeValueTrend(60, 70)).toBe("dropping");
    expect(computeValueTrend(80, undefined)).toBe("stable");
  });

  it("blends rarity and stock with fixed weights", () => {
    const score = computeEffectiveTokenScore(100, "out_of_stock");
    expect(score).toBe(
      Math.round(100 * TOKEN_RARITY_WEIGHT + 100 * TOKEN_STOCK_WEIGHT),
    );

    const easier = computeEffectiveTokenScore(100, "in_stock");
    expect(easier).toBeLessThan(score);
  });

  it("builds server snapshots from availability map", () => {
    const snapshots = buildTokenSnapshots(
      {
        "wooting-60he-plus": {
          keyboardId: "wooting-60he-plus",
          status: "out_of_stock",
          checkedAt: "2026-06-17T12:00:00.000Z",
          source: "https://wooting.io/wooting-60he",
        },
        "corsair-k70-rgb-mk2": {
          keyboardId: "corsair-k70-rgb-mk2",
          status: "in_stock",
          checkedAt: "2026-06-17T12:00:00.000Z",
          source: "https://www.corsair.com/example",
        },
      },
      "2026-06-17T12:00:00.000Z",
      {
        "wooting-60he-plus": 66,
        "corsair-k70-rgb-mk2": 61,
      },
    );

    expect(snapshots).toHaveLength(keyboardTokens.length);
    expect(snapshots[0]?.keyboardId).toBe("wooting-60he-plus");
    expect(snapshots[0]?.stockStatus).toBe("out_of_stock");
    expect(snapshots[0]?.valueTrend).toBe("rising");
    expect(snapshots.at(-1)?.keyboardId).toBe("corsair-k70-rgb-mk2");
    expect(snapshots.at(-1)?.valueTrend).toBe("dropping");
  });
});
