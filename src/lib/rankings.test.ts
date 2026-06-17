import { describe, expect, it } from "vitest";
import { keyboards } from "@/data/keyboards";
import {
  computeSpeedScore,
  getRankedKeyboards,
  getSpeedScoreBreakdown,
  sortKeyboards,
} from "@/lib/rankings";
import type { Keyboard } from "@/types";

const hallEffectBoard: Keyboard = {
  id: "test-he",
  brandId: "wooting",
  name: "Test HE",
  releaseDate: "2024-01-01",
  priceUsd: 200,
  tagline: "Test",
  image: "/keyboards/test.png",
  purchaseUrl: "https://example.com/buy",
  stats: {
    switchType: "Hall-effect",
    layout: "60%",
    connectivity: ["USB-C wired"],
    actuationPointMm: 0.1,
    keyTravelMm: 4,
    pollingRateHz: 8000,
    responseTimeMs: 0.125,
    rapidTrigger: true,
  },
};

describe("getSpeedScoreBreakdown", () => {
  it("awards max points for top-tier competitive specs", () => {
    const breakdown = getSpeedScoreBreakdown(hallEffectBoard);

    expect(breakdown.polling).toBe(30);
    expect(breakdown.response).toBe(33);
    expect(breakdown.actuation).toBe(24);
    expect(breakdown.rapidTrigger).toBe(10);
    expect(breakdown.total).toBe(97);
  });

  it("matches computeSpeedScore total", () => {
    for (const keyboard of keyboards) {
      const breakdown = getSpeedScoreBreakdown(keyboard);
      expect(computeSpeedScore(keyboard)).toBe(breakdown.total);
    }
  });

  it("penalizes missing rapid trigger", () => {
    const withoutRt = getSpeedScoreBreakdown({
      ...hallEffectBoard,
      stats: { ...hallEffectBoard.stats, rapidTrigger: false },
    });

    expect(withoutRt.rapidTrigger).toBe(0);
    expect(withoutRt.total).toBe(87);
  });
});

describe("sortKeyboards", () => {
  it("sorts by speed score descending", () => {
    const sorted = sortKeyboards(keyboards, "speed");
    const scores = sorted.map(computeSpeedScore);

    for (let i = 1; i < scores.length; i++) {
      expect(scores[i - 1]).toBeGreaterThanOrEqual(scores[i]!);
    }
  });

  it("sorts by price ascending and descending", () => {
    const asc = sortKeyboards(keyboards, "price-asc");
    const desc = sortKeyboards(keyboards, "price-desc");

    expect(asc[0]!.priceUsd).toBeLessThanOrEqual(asc.at(-1)!.priceUsd);
    expect(desc[0]!.priceUsd).toBeGreaterThanOrEqual(desc.at(-1)!.priceUsd);
  });

  it("sorts by newest release first", () => {
    const sorted = sortKeyboards(keyboards, "newest");

    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]!.releaseDate).getTime();
      const curr = new Date(sorted[i]!.releaseDate).getTime();
      expect(prev).toBeGreaterThanOrEqual(curr);
    }
  });
});

describe("getRankedKeyboards", () => {
  it("assigns sequential ranks", () => {
    const ranked = getRankedKeyboards(keyboards, "speed");

    expect(ranked).toHaveLength(keyboards.length);
    ranked.forEach((keyboard, index) => {
      expect(keyboard.rank).toBe(index + 1);
      expect(keyboard.score).toBe(keyboard.scoreBreakdown.total);
    });
  });
});
