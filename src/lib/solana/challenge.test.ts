import { describe, expect, it, beforeEach } from "vitest";
import { signAsync, utils, getPublicKeyAsync } from "@noble/ed25519";
import bs58 from "bs58";
import {
  buildClaimMessage,
  consumeAndVerifyClaimSignature,
  issueKeyboardClaimChallenge,
  resetChallengesForTests,
} from "@/lib/solana/challenge";

describe("claim challenge signatures", () => {
  beforeEach(() => {
    resetChallengesForTests();
  });

  it("builds a stable claim message", () => {
    const message = buildClaimMessage({
      walletAddress: "Wallet111111111111111111111111111111111",
      keyboardId: "wooting-60he-plus",
      nonce: "abc",
      issuedAt: "2026-01-01T00:00:00.000Z",
    });

    expect(message).toContain("KeySol Token Claim");
    expect(message).toContain("wooting-60he-plus");
    expect(message).toContain("Nonce: abc");
  });

  it("accepts a valid ed25519 signature and consumes the challenge", async () => {
    const secret = utils.randomSecretKey();
    const publicKey = await getPublicKeyAsync(secret);
    const walletAddress = bs58.encode(publicKey);
    const keyboardId = "wooting-60he-plus";

    const issued = issueKeyboardClaimChallenge({ walletAddress, keyboardId });
    const signature = await signAsync(
      new TextEncoder().encode(issued.challenge),
      secret,
    );

    const first = await consumeAndVerifyClaimSignature({
      challengeId: issued.challengeId,
      walletAddress,
      keyboardId,
      message: issued.challenge,
      signatureBase58: bs58.encode(signature),
    });
    expect(first).toEqual({ ok: true });

    const second = await consumeAndVerifyClaimSignature({
      challengeId: issued.challengeId,
      walletAddress,
      keyboardId,
      message: issued.challenge,
      signatureBase58: bs58.encode(signature),
    });
    expect(second.ok).toBe(false);
  });

  it("rejects a signature from a different wallet", async () => {
    const secretA = utils.randomSecretKey();
    const secretB = utils.randomSecretKey();
    const walletA = bs58.encode(await getPublicKeyAsync(secretA));
    const walletB = bs58.encode(await getPublicKeyAsync(secretB));
    const keyboardId = "wooting-two-he";

    const issued = issueKeyboardClaimChallenge({
      walletAddress: walletA,
      keyboardId,
    });
    const signature = await signAsync(
      new TextEncoder().encode(issued.challenge),
      secretB,
    );

    const result = await consumeAndVerifyClaimSignature({
      challengeId: issued.challengeId,
      walletAddress: walletA,
      keyboardId,
      message: issued.challenge,
      signatureBase58: bs58.encode(signature),
    });

    expect(result).toEqual({ ok: false, error: "Invalid wallet signature" });
  });

  it("rejects a tampered message", async () => {
    const secret = utils.randomSecretKey();
    const walletAddress = bs58.encode(await getPublicKeyAsync(secret));
    const keyboardId = "steelseries-apex-pro-gen3-tkl";

    const issued = issueKeyboardClaimChallenge({ walletAddress, keyboardId });
    const tampered = `${issued.challenge}\nextra`;
    const signature = await signAsync(
      new TextEncoder().encode(tampered),
      secret,
    );

    const result = await consumeAndVerifyClaimSignature({
      challengeId: issued.challengeId,
      walletAddress,
      keyboardId,
      message: tampered,
      signatureBase58: bs58.encode(signature),
    });

    expect(result).toEqual({
      ok: false,
      error: "Signed message does not match challenge",
    });
  });
});
