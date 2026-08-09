import { describe, expect, it } from "vitest";
import { brands } from "@/data/brands";
import { keyboards } from "@/data/keyboards";
import { switchTypes } from "@/data/switch-types";
import { SOLANA_KEYBOARD } from "@/components/layout/nav-links";
import {
  buildCatalogContext,
  findSwitchTypesByQuery,
} from "./knowledge";
import { getCatalogStats } from "./rules";

describe("assistant knowledge", () => {
  it("includes every catalog keyboard in context", () => {
    const context = buildCatalogContext();

    for (const keyboard of keyboards) {
      expect(context).toContain(keyboard.name);
    }
  });

  it("includes the Solana × Thock King collab board", () => {
    const context = buildCatalogContext();
    expect(context).toContain(SOLANA_KEYBOARD.name);
    expect(context).toContain("/solana-keyboards");
    expect(context).toContain("TTC Silent Brown");
  });

  it("includes switch guide data", () => {
    const context = buildCatalogContext();

    for (const entry of switchTypes.slice(0, 3)) {
      expect(context).toContain(entry.name);
    }
  });

  it("reports current catalog stats", () => {
    expect(getCatalogStats()).toEqual({
      keyboardCount: keyboards.length,
      brandCount: brands.length,
    });
  });

  it("finds switch profiles by query", () => {
    const matches = findSwitchTypesByQuery("cherry mx speed");
    expect(matches.some((entry) => entry.id === "cherry-mx-speed")).toBe(true);
  });
});
