import { describe, expect, it } from "vitest";
import { compareCollectibleRarity, getRarityTier } from "./rarity";

describe("getRarityTier", () => {
  it("marks high-score low-supply boards as legendary", () => {
    expect(getRarityTier(99, 250).tier).toBe("legendary");
    expect(getRarityTier(100, 500).tier).toBe("legendary");
  });

  it("bands remaining scores into rare / uncommon / common", () => {
    expect(getRarityTier(88, 750).tier).toBe("rare");
    expect(getRarityTier(60, 3000).tier).toBe("uncommon");
    expect(getRarityTier(30, 10_000).tier).toBe("common");
  });

  it("exposes catch hints without numeric scores", () => {
    expect(getRarityTier(99, 250).catchHint.toLowerCase()).toContain("stock");
    expect(getRarityTier(30, 10_000).catchHint.toLowerCase()).toContain(
      "easiest",
    );
  });
});

describe("compareCollectibleRarity", () => {
  it("sorts legendary before common and prefers in-stock within a tier", () => {
    expect(
      compareCollectibleRarity(
        { rarityScore: 99, maxSupply: 250, stockStatus: "out_of_stock" },
        { rarityScore: 30, maxSupply: 10_000, stockStatus: "in_stock" },
      ),
    ).toBeLessThan(0);

    expect(
      compareCollectibleRarity(
        { rarityScore: 99, maxSupply: 250, stockStatus: "in_stock" },
        { rarityScore: 99, maxSupply: 250, stockStatus: "out_of_stock" },
      ),
    ).toBeLessThan(0);
  });
});
