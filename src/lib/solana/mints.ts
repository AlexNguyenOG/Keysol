import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { getSolanaCluster } from "@/lib/solana/cluster";
import type {
  TokenMintRecord,
  TokenMintRegistry,
} from "@/lib/solana/mint-registry";
import { getMintRegistryPath } from "@/lib/solana/mint-registry";
import { keyboardTokens } from "@/data/keyboard-tokens";
import type { KeyboardToken } from "@/types";

let cachedRegistry: TokenMintRegistry | null | undefined;

export function readMintRegistry(): TokenMintRegistry | null {
  if (cachedRegistry !== undefined) {
    return cachedRegistry;
  }

  const cluster = getSolanaCluster();
  const relative = getMintRegistryPath(cluster);
  const filePath = path.join(process.cwd(), relative);

  if (!existsSync(filePath)) {
    cachedRegistry = null;
    return null;
  }

  try {
    cachedRegistry = JSON.parse(
      readFileSync(filePath, "utf8"),
    ) as TokenMintRegistry;
    return cachedRegistry;
  } catch {
    cachedRegistry = null;
    return null;
  }
}

export function getMintForKeyboard(
  keyboardId: string,
): TokenMintRecord | undefined {
  return readMintRegistry()?.mints.find(
    (mint) => mint.keyboardId === keyboardId,
  );
}

/** Merge Devnet mint addresses into catalog tokens when a registry exists. */
export function withMintAddresses(tokens: KeyboardToken[]): KeyboardToken[] {
  const registry = readMintRegistry();
  if (!registry) {
    return tokens;
  }

  const byKeyboard = new Map(
    registry.mints.map((mint) => [mint.keyboardId, mint.mintAddress]),
  );

  return tokens.map((token) => {
    const mintAddress = byKeyboard.get(token.keyboardId);
    if (!mintAddress) {
      return token;
    }
    return { ...token, mintAddress };
  });
}

export function getClaimableTokens(): KeyboardToken[] {
  return withMintAddresses(keyboardTokens).filter((token) =>
    Boolean(token.mintAddress),
  );
}
