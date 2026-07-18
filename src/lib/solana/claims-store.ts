import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { getAppDb } from "@/lib/db/app";

export interface TokenClaimRecord {
  walletAddress: string;
  keyboardId: string;
  mintAddress: string;
  signature: string;
  claimedAt: string;
}

const FILE_CLAIMS_PATH = path.join(process.cwd(), ".cache", "token-claims.json");

async function ensureClaimsTable(): Promise<void> {
  const db = await getAppDb();
  if (!db) {
    return;
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS token_claims (
      wallet_address TEXT NOT NULL,
      keyboard_id TEXT NOT NULL,
      mint_address TEXT NOT NULL,
      signature TEXT NOT NULL,
      claimed_at INTEGER NOT NULL,
      PRIMARY KEY (wallet_address, keyboard_id)
    )
  `);
}

async function readFileClaims(): Promise<TokenClaimRecord[]> {
  try {
    const raw = await fs.readFile(FILE_CLAIMS_PATH, "utf8");
    return JSON.parse(raw) as TokenClaimRecord[];
  } catch {
    return [];
  }
}

async function writeFileClaims(claims: TokenClaimRecord[]): Promise<void> {
  await fs.mkdir(path.dirname(FILE_CLAIMS_PATH), { recursive: true });
  await fs.writeFile(FILE_CLAIMS_PATH, `${JSON.stringify(claims, null, 2)}\n`);
}

export async function hasClaimedToken(
  walletAddress: string,
  keyboardId: string,
): Promise<boolean> {
  await ensureClaimsTable();
  const db = await getAppDb();

  if (db) {
    const result = await db.execute({
      sql: `SELECT 1 FROM token_claims WHERE wallet_address = ? AND keyboard_id = ? LIMIT 1`,
      args: [walletAddress, keyboardId],
    });
    return result.rows.length > 0;
  }

  const claims = await readFileClaims();
  return claims.some(
    (claim) =>
      claim.walletAddress === walletAddress && claim.keyboardId === keyboardId,
  );
}

export async function countClaimsForKeyboard(
  keyboardId: string,
): Promise<number> {
  await ensureClaimsTable();
  const db = await getAppDb();

  if (db) {
    const result = await db.execute({
      sql: `SELECT COUNT(*) as count FROM token_claims WHERE keyboard_id = ?`,
      args: [keyboardId],
    });
    const count = result.rows[0]?.count;
    return typeof count === "bigint" ? Number(count) : Number(count ?? 0);
  }

  const claims = await readFileClaims();
  return claims.filter((claim) => claim.keyboardId === keyboardId).length;
}

export async function recordTokenClaim(
  claim: TokenClaimRecord,
): Promise<void> {
  await ensureClaimsTable();
  const db = await getAppDb();

  if (db) {
    await db.execute({
      sql: `INSERT INTO token_claims (wallet_address, keyboard_id, mint_address, signature, claimed_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        claim.walletAddress,
        claim.keyboardId,
        claim.mintAddress,
        claim.signature,
        Date.parse(claim.claimedAt),
      ],
    });
    return;
  }

  const claims = await readFileClaims();
  claims.push(claim);
  await writeFileClaims(claims);
}

export async function listClaimsForWallet(
  walletAddress: string,
): Promise<TokenClaimRecord[]> {
  await ensureClaimsTable();
  const db = await getAppDb();

  if (db) {
    const result = await db.execute({
      sql: `SELECT wallet_address, keyboard_id, mint_address, signature, claimed_at
            FROM token_claims WHERE wallet_address = ? ORDER BY claimed_at DESC`,
      args: [walletAddress],
    });

    return result.rows.map((row) => ({
      walletAddress: String(row.wallet_address),
      keyboardId: String(row.keyboard_id),
      mintAddress: String(row.mint_address),
      signature: String(row.signature),
      claimedAt: new Date(Number(row.claimed_at)).toISOString(),
    }));
  }

  const claims = await readFileClaims();
  return claims.filter((claim) => claim.walletAddress === walletAddress);
}
