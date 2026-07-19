import "server-only";

import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { verifyAsync } from "@noble/ed25519";
import bs58 from "bs58";
import { getAppDb } from "@/lib/db/app";
import { getSolanaCluster } from "@/lib/solana/cluster";

interface ChallengeRecord {
  challengeId: string;
  challenge: string;
  walletAddress: string;
  keyboardId: string;
  expiresAt: number;
}

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const FILE_CHALLENGES_PATH = path.join(
  process.cwd(),
  ".cache",
  "token-challenges.json",
);

async function ensureChallengesTable(): Promise<void> {
  const db = await getAppDb();
  if (!db) {
    return;
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS token_claim_challenges (
      challenge_id TEXT PRIMARY KEY,
      challenge TEXT NOT NULL,
      wallet_address TEXT NOT NULL,
      keyboard_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    )
  `);
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_token_claim_challenges_expires
    ON token_claim_challenges(expires_at)
  `);
}

async function readFileChallenges(): Promise<ChallengeRecord[]> {
  try {
    const raw = await fs.readFile(FILE_CHALLENGES_PATH, "utf8");
    return JSON.parse(raw) as ChallengeRecord[];
  } catch {
    return [];
  }
}

async function writeFileChallenges(records: ChallengeRecord[]): Promise<void> {
  await fs.mkdir(path.dirname(FILE_CHALLENGES_PATH), { recursive: true });
  await fs.writeFile(
    FILE_CHALLENGES_PATH,
    `${JSON.stringify(records, null, 2)}\n`,
  );
}

async function pruneExpired(now = Date.now()): Promise<void> {
  await ensureChallengesTable();
  const db = await getAppDb();

  if (db) {
    await db.execute({
      sql: `DELETE FROM token_claim_challenges WHERE expires_at <= ?`,
      args: [now],
    });
    return;
  }

  const records = await readFileChallenges();
  const kept = records.filter((record) => record.expiresAt > now);
  if (kept.length !== records.length) {
    await writeFileChallenges(kept);
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

export async function issueKeyboardClaimChallenge(input: {
  walletAddress: string;
  keyboardId: string;
}): Promise<{
  challengeId: string;
  challenge: string;
  expiresAt: string;
}> {
  await pruneExpired();
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
  const record: ChallengeRecord = {
    challengeId,
    challenge,
    walletAddress: input.walletAddress,
    keyboardId: input.keyboardId,
    expiresAt,
  };

  await ensureChallengesTable();
  const db = await getAppDb();

  if (db) {
    await db.execute({
      sql: `INSERT INTO token_claim_challenges
            (challenge_id, challenge, wallet_address, keyboard_id, expires_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        record.challengeId,
        record.challenge,
        record.walletAddress,
        record.keyboardId,
        record.expiresAt,
      ],
    });
  } else {
    const records = await readFileChallenges();
    records.push(record);
    await writeFileChallenges(records);
  }

  return {
    challengeId,
    challenge,
    expiresAt: new Date(expiresAt).toISOString(),
  };
}

async function loadChallenge(
  challengeId: string,
): Promise<ChallengeRecord | null> {
  await ensureChallengesTable();
  const db = await getAppDb();

  if (db) {
    const result = await db.execute({
      sql: `SELECT challenge_id, challenge, wallet_address, keyboard_id, expires_at
            FROM token_claim_challenges WHERE challenge_id = ? LIMIT 1`,
      args: [challengeId],
    });
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    return {
      challengeId: String(row.challenge_id),
      challenge: String(row.challenge),
      walletAddress: String(row.wallet_address),
      keyboardId: String(row.keyboard_id),
      expiresAt: Number(row.expires_at),
    };
  }

  const records = await readFileChallenges();
  return records.find((record) => record.challengeId === challengeId) ?? null;
}

async function deleteChallenge(challengeId: string): Promise<void> {
  await ensureChallengesTable();
  const db = await getAppDb();

  if (db) {
    await db.execute({
      sql: `DELETE FROM token_claim_challenges WHERE challenge_id = ?`,
      args: [challengeId],
    });
    return;
  }

  const records = await readFileChallenges();
  await writeFileChallenges(
    records.filter((record) => record.challengeId !== challengeId),
  );
}

export async function consumeAndVerifyClaimSignature(input: {
  challengeId: string;
  walletAddress: string;
  keyboardId: string;
  message: string;
  signatureBase58: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await pruneExpired();
  const record = await loadChallenge(input.challengeId);
  if (!record) {
    return { ok: false, error: "Challenge expired or unknown. Request a new one." };
  }

  if (record.expiresAt <= Date.now()) {
    await deleteChallenge(input.challengeId);
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

  await deleteChallenge(input.challengeId);
  return { ok: true };
}

/** @internal test helper */
export async function resetChallengesForTests(): Promise<void> {
  await ensureChallengesTable();
  const db = await getAppDb();
  if (db) {
    await db.execute(`DELETE FROM token_claim_challenges`);
  }
  try {
    await fs.unlink(FILE_CHALLENGES_PATH);
  } catch {
    // ignore missing file
  }
}
