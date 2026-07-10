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
    expect(result.drop.token.rarityTier).toBe("legendary");
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
});
