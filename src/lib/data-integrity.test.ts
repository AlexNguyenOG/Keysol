import { existsSync, readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { brands } from "@/data/brands";
import { keyboards } from "@/data/keyboards";
import { keyboardShowcases } from "@/data/keyboard-showcases";
import { getSwitchTypeForKeyboard, switchTypes } from "@/data/switch-types";
import { getKeyboardsByBrandId } from "@/lib/keyboards";

const publicDir = path.join(process.cwd(), "public");

describe("brand data", () => {
  it("has unique brand ids", () => {
    const ids = brands.map((brand) => brand.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("keyboard data", () => {
  it("has unique keyboard ids", () => {
    const ids = keyboards.map((keyboard) => keyboard.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("references valid brands", () => {
    const brandIds = new Set(brands.map((brand) => brand.id));

    for (const keyboard of keyboards) {
      expect(brandIds.has(keyboard.brandId)).toBe(true);
    }
  });

  it("has image files on disk", () => {
    for (const keyboard of keyboards) {
      expect(keyboard.image.startsWith("/keyboards/")).toBe(true);
      const filePath = path.join(publicDir, keyboard.image);
      expect(existsSync(filePath)).toBe(true);
    }
  });

  it("has official showcase clips for registered keyboards", () => {
    for (const entry of keyboardShowcases) {
      const filePath = path.join(
        publicDir,
        "keyboards",
        "showcases",
        `${entry.keyboardId}.mp4`,
      );
      expect(existsSync(filePath)).toBe(true);
    }
  });

  it("has brand icon files on disk", () => {
    for (const brand of brands) {
      const filePath = path.join(publicDir, "brands", `${brand.id}.svg`);
      expect(existsSync(filePath)).toBe(true);
    }
  });

  it("includes at least one keyboard per brand", () => {
    for (const brand of brands) {
      expect(getKeyboardsByBrandId(brand.id).length).toBeGreaterThan(0);
    }
  });

  it("uses valid stat ranges", () => {
    for (const keyboard of keyboards) {
      const { stats } = keyboard;
      expect(stats.pollingRateHz).toBeGreaterThan(0);
      expect(stats.responseTimeMs).toBeGreaterThan(0);
      expect(stats.actuationPointMm).toBeGreaterThan(0);
      expect(stats.keyTravelMm).toBeGreaterThan(0);
      expect(stats.connectivity.length).toBeGreaterThan(0);
      expect(keyboard.priceUsd).toBeGreaterThan(0);
    }
  });

  it("has valid purchase links", () => {
    for (const keyboard of keyboards) {
      expect(keyboard.purchaseUrl).toMatch(/^https:\/\//);
    }
  });

  it("maps every keyboard to a switch profile with sound and feel", () => {
    for (const keyboard of keyboards) {
      const profile = getSwitchTypeForKeyboard(keyboard.id);
      expect(profile).toBeDefined();
      expect(profile?.sound.length).toBeGreaterThan(10);
      expect(profile?.feel.length).toBeGreaterThan(10);
    }

    for (const entry of switchTypes) {
      expect(entry.sound.length).toBeGreaterThan(10);
      expect(entry.feel.length).toBeGreaterThan(10);
    }
  });

  it("has bundled availability snapshot for production deploys", () => {
    const snapshotPath = path.join(
      process.cwd(),
      "src/data/availability.snapshot.json",
    );
    expect(existsSync(snapshotPath)).toBe(true);

    const snapshot = JSON.parse(
      readFileSync(snapshotPath, "utf8"),
    ) as Record<string, { keyboardId: string; status: string }>;

    for (const keyboard of keyboards) {
      expect(snapshot[keyboard.id]).toBeDefined();
      expect(snapshot[keyboard.id]?.status).toMatch(
        /^(in_stock|out_of_stock|limited|unknown)$/,
      );
    }
  });
});
