import { describe, expect, it } from "vitest";
import {
  formatPollingRate,
  formatPrice,
  formatReleaseDate,
} from "@/lib/format";

describe("format helpers", () => {
  it("formats USD prices without cents", () => {
    expect(formatPrice(175)).toBe("$175");
  });

  it("formats release dates", () => {
    expect(formatReleaseDate("2024-03-01")).toBe("March 2024");
  });

  it("formats polling rates with separators", () => {
    expect(formatPollingRate(8000)).toBe("8,000 Hz");
  });
});
