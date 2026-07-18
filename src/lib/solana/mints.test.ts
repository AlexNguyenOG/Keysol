import { describe, expect, it } from "vitest";
import { withMintAddresses } from "@/lib/solana/mints";
import type { KeyboardToken } from "@/types";

describe("solana mint helpers", () => {
  it("leaves tokens unchanged when no registry is present", () => {
    const tokens: KeyboardToken[] = [
      {
        id: "keysol-test",
        keyboardId: "test-board",
        symbol: "KSOL-TEST",
        name: "Test",
        rarityScore: 50,
        maxSupply: 100,
        rationale: "Unit test token entry for mint merge helper.",
      },
    ];

    expect(withMintAddresses(tokens)[0]?.mintAddress).toBeUndefined();
  });
});
