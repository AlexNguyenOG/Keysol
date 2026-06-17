import { existsSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { brands } from "@/data/brands";
import { keyboards } from "@/data/keyboards";
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
});
