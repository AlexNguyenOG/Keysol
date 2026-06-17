import { describe, expect, it } from "vitest";
import { isStale } from "./cache";
import type { AvailabilityRecord } from "./types";
import { CACHE_TTL_MS } from "./types";

describe("availability cache", () => {
  it("marks records older than TTL as stale", () => {
    const record: AvailabilityRecord = {
      keyboardId: "test",
      status: "in_stock",
      checkedAt: new Date(Date.now() - CACHE_TTL_MS - 1).toISOString(),
      source: "https://example.com",
    };

    expect(isStale(record)).toBe(true);
  });

  it("marks fresh records as not stale", () => {
    const record: AvailabilityRecord = {
      keyboardId: "test",
      status: "in_stock",
      checkedAt: new Date().toISOString(),
      source: "https://example.com",
    };

    expect(isStale(record)).toBe(false);
  });
});
