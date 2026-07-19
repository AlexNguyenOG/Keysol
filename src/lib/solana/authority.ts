import "server-only";

import fs from "node:fs";
import path from "node:path";
import {
  createKeyPairSignerFromBytes,
  type KeyPairSigner,
} from "@solana/kit";

function resolveKeypairPath(): string {
  const configured =
    process.env.TOKEN_MINT_AUTHORITY_KEYPAIR?.trim() ||
    ".keys/mint-authority.json";
  return path.isAbsolute(configured)
    ? configured
    : path.join(process.cwd(), configured);
}

function parseKeypairBytes(raw: unknown, source: string): Uint8Array {
  if (!Array.isArray(raw) || raw.length < 64) {
    throw new Error(`Invalid mint authority keypair from ${source}`);
  }
  return Uint8Array.from(raw as number[]);
}

/** Load the mint-authority keypair used to create mints and claim tokens. */
export async function loadMintAuthoritySigner(): Promise<KeyPairSigner> {
  const jsonEnv = process.env.TOKEN_MINT_AUTHORITY_JSON?.trim();
  if (jsonEnv) {
    const raw = JSON.parse(jsonEnv) as unknown;
    return createKeyPairSignerFromBytes(parseKeypairBytes(raw, "TOKEN_MINT_AUTHORITY_JSON"));
  }

  const keypairPath = resolveKeypairPath();
  if (!fs.existsSync(keypairPath)) {
    throw new Error(
      `Mint authority keypair not found. Set TOKEN_MINT_AUTHORITY_JSON or place a keypair at ${keypairPath}.`,
    );
  }

  const raw = JSON.parse(fs.readFileSync(keypairPath, "utf8")) as unknown;
  return createKeyPairSignerFromBytes(parseKeypairBytes(raw, keypairPath));
}

export function getMintAuthorityKeypairPath(): string {
  return resolveKeypairPath();
}
