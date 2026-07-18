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

/** Load the Devnet mint-authority keypair used to create mints and claim tokens. */
export async function loadMintAuthoritySigner(): Promise<KeyPairSigner> {
  const keypairPath = resolveKeypairPath();
  if (!fs.existsSync(keypairPath)) {
    throw new Error(
      `Mint authority keypair not found at ${keypairPath}. Run: npm run tokens:devnet:create`,
    );
  }

  const raw = JSON.parse(fs.readFileSync(keypairPath, "utf8")) as number[];
  if (!Array.isArray(raw) || raw.length < 64) {
    throw new Error(`Invalid keypair file: ${keypairPath}`);
  }

  return createKeyPairSignerFromBytes(Uint8Array.from(raw));
}

export function getMintAuthorityKeypairPath(): string {
  return resolveKeypairPath();
}
