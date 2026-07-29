import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeAppDbForTests, resetAppDbForTests } from "@/lib/db/app";
import { getAllKeyboards, getFeaturedDrops } from "@/lib/catalog.server";
import {
  approveDropCandidate,
  rejectDropCandidate,
} from "@/lib/drops/approve";
import { resetDropsForTests, upsertDropCandidate } from "@/lib/drops/store";
import { DROP_TOKEN_DEFAULTS } from "@/lib/drops/types";

describe("drop approval pipeline", () => {
  let dbPath: string;

  beforeEach(async () => {
    dbPath = path.join(mkdtempSync(path.join(tmpdir(), "keysol-drops-")), "app.db");
    await resetAppDbForTests(dbPath);
    await resetDropsForTests();
  });

  afterEach(() => {
    closeAppDbForTests();
  });

  it("approves a candidate into the merged catalog with low max supply", async () => {
    const candidate = await upsertDropCandidate({
      brandId: "wooting",
      name: "Wooting 60HE LE Frost",
      sourceUrl: "https://wooting.io/wooting-60he-le-frost",
      purchaseUrl: "https://wooting.io/wooting-60he-le-frost",
      detectionSource: "manual",
      signals: ["limited edition", "numbered run"],
      confidence: 0.9,
      rawSnippet: "Only 500 units made.",
    });

    const result = await approveDropCandidate({
      candidateId: candidate.id,
      approvedBy: "admin",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.drop.token.maxSupply).toBe(DROP_TOKEN_DEFAULTS.maxSupply);
    expect(result.drop.token.rarityScore).toBe(DROP_TOKEN_DEFAULTS.rarityScore);
    expect(result.drop.keyboard.badge).toBe("Limited Drop");

    const merged = await getAllKeyboards();
    expect(merged.some((keyboard) => keyboard.id === result.drop.keyboardId)).toBe(
      true,
    );

    const featured = await getFeaturedDrops();
    expect(featured).toHaveLength(1);
  });

  it("rejects a candidate without publishing", async () => {
    const candidate = await upsertDropCandidate({
      brandId: "razer",
      name: "Razer Test LE",
      sourceUrl: "https://www.razer.com/test-le-keyboard",
      detectionSource: "scanner",
      signals: ["limited edition"],
      confidence: 0.7,
    });

    const result = await rejectDropCandidate(candidate.id, "admin");
    expect(result.ok).toBe(true);
    expect(await getFeaturedDrops()).toHaveLength(0);
  });

  it("replaces out_of_stock and unknown featured drops when approving a new LE", async () => {
    const { writeCache } = await import("@/lib/availability/cache");
    const { publishDrop, listPublishedDrops } = await import(
      "@/lib/drops/store"
    );

    await publishDrop({
      keyboard: {
        id: "keep-in-stock-le",
        brandId: "wooting",
        name: "Keep In Stock LE",
        releaseDate: "2026-01-01",
        priceUsd: 199,
        tagline: "Still available",
        badge: "Limited Drop",
        image: "/keyboards/drop-placeholder.svg",
        purchaseUrl: "https://wooting.io/keep-in-stock-le",
        stats: {
          switchType: "Limited edition / special run",
          layout: "TKL",
          connectivity: ["USB-C wired"],
          actuationPointMm: 0.1,
          keyTravelMm: 3.5,
          pollingRateHz: 8000,
          responseTimeMs: 0.125,
          rapidTrigger: true,
        },
      },
      token: {
        id: "token-keep",
        keyboardId: "keep-in-stock-le",
        symbol: "KSOL-KEEP",
        name: "Keep Token",
        rarityScore: 99,
        maxSupply: 250,
        rationale: "test",
      },
      candidateId: null,
      approvedBy: "test",
    });

    await publishDrop({
      keyboard: {
        id: "replace-oos-le",
        brandId: "razer",
        name: "Replace OOS LE",
        releaseDate: "2026-01-01",
        priceUsd: 199,
        tagline: "Gone",
        badge: "Limited Drop",
        image: "/keyboards/drop-placeholder.svg",
        purchaseUrl: "https://www.razer.com/replace-oos-le",
        stats: {
          switchType: "Limited edition / special run",
          layout: "TKL",
          connectivity: ["USB-C wired"],
          actuationPointMm: 0.1,
          keyTravelMm: 3.5,
          pollingRateHz: 8000,
          responseTimeMs: 0.125,
          rapidTrigger: true,
        },
      },
      token: {
        id: "token-oos",
        keyboardId: "replace-oos-le",
        symbol: "KSOL-OOS",
        name: "OOS Token",
        rarityScore: 99,
        maxSupply: 250,
        rationale: "test",
      },
      candidateId: null,
      approvedBy: "test",
    });

    await writeCache({
      "keep-in-stock-le": {
        keyboardId: "keep-in-stock-le",
        status: "in_stock",
        checkedAt: new Date().toISOString(),
        source: "test",
      },
      "replace-oos-le": {
        keyboardId: "replace-oos-le",
        status: "out_of_stock",
        checkedAt: new Date().toISOString(),
        source: "test",
      },
    });

    const candidate = await upsertDropCandidate({
      brandId: "keychron",
      name: "Fresh Limited Drop",
      sourceUrl: "https://www.keychron.com/products/fresh-limited-drop",
      purchaseUrl: "https://www.keychron.com/products/fresh-limited-drop",
      detectionSource: "manual",
      signals: ["limited edition"],
      confidence: 0.95,
    });

    const result = await approveDropCandidate({
      candidateId: candidate.id,
      approvedBy: "admin",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.replacedKeyboardIds).toEqual(["replace-oos-le"]);

    const featured = await listPublishedDrops();
    const ids = featured.map((drop) => drop.keyboardId).sort();
    expect(ids).toEqual(
      ["keep-in-stock-le", result.drop.keyboardId].sort(),
    );
  });
});
