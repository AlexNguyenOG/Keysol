import "server-only";

import { randomBytes } from "node:crypto";
import { verifyAsync } from "@noble/ed25519";
import bs58 from "bs58";
import { getSolanaCluster } from "@/lib/solana/cluster";

interface ChallengeRecord {
  challenge: string;
  walletAddress: string;
  keyboardId: string;
  expiresAt: number;
}

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const challenges = new Map<string, ChallengeRecord>();

function pruneExpired(now = Date.now()): void {
  for (const [id, record] of challenges) {
    if (record.expiresAt <= now) {
      challenges.delete(id);
    }
  }
}

export function buildClaimMessage(input: {
  walletAddress: string;
  keyboardId: string;
  nonce: string;
  issuedAt: string;
}): string {
  const cluster = getSolanaCluster();
  return [
    "KeySol Token Claim",
    `Cluster: ${cluster}`,
    `Wallet: ${input.walletAddress}`,
    `Keyboard: ${input.keyboardId}`,
    `Nonce: ${input.nonce}`,
    `Issued At: ${input.issuedAt}`,
    "",
    "Sign this message to prove wallet ownership. It does not move funds.",
  ].join("\n");
}

export function issueKeyboardClaimChallenge(input: {
  walletAddress: string;
  keyboardId: string;
}): {
  challengeId: string;
  challenge: string;
  expiresAt: string;
} {
  pruneExpired();
  const challengeId = randomBytes(16).toString("hex");
  const nonce = randomBytes(16).toString("hex");
  const issuedAt = new Date().toISOString();
  const challenge = buildClaimMessage({
    walletAddress: input.walletAddress,
    keyboardId: input.keyboardId,
    nonce,
    issuedAt,
  });
  const expiresAt = Date.now() + CHALLENGE_TTL_MS;

  challenges.set(challengeId, {
    challenge,
    walletAddress: input.walletAddress,
    keyboardId: input.keyboardId,
    expiresAt,
  });

  return {
    challengeId,
    challenge,
    expiresAt: new Date(expiresAt).toISOString(),
  };
}

export async function consumeAndVerifyClaimSignature(input: {
  challengeId: string;
  walletAddress: string;
  keyboardId: string;
  message: string;
  signatureBase58: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  pruneExpired();
  const record = challenges.get(input.challengeId);
  if (!record) {
    return { ok: false, error: "Challenge expired or unknown. Request a new one." };
  }

  if (record.expiresAt <= Date.now()) {
    challenges.delete(input.challengeId);
    return { ok: false, error: "Challenge expired. Request a new one." };
  }

  if (record.walletAddress !== input.walletAddress) {
    return { ok: false, error: "Challenge wallet mismatch" };
  }

  if (record.keyboardId !== input.keyboardId) {
    return { ok: false, error: "Challenge keyboard mismatch" };
  }

  if (record.challenge !== input.message) {
    return { ok: false, error: "Signed message does not match challenge" };
  }

  try {
    const publicKey = bs58.decode(input.walletAddress);
    const signature = bs58.decode(input.signatureBase58);
    const messageBytes = new TextEncoder().encode(input.message);
    const valid = await verifyAsync(signature, messageBytes, publicKey);
    if (!valid) {
      return { ok: false, error: "Invalid wallet signature" };
    }
  } catch {
    return { ok: false, error: "Could not verify wallet signature" };
  }

  challenges.delete(input.challengeId);
  return { ok: true };
}

/** @internal test helper */
export function resetChallengesForTests(): void {
  challenges.clear();
}
