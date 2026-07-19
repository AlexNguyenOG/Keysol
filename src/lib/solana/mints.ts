import { readFileSync, existsSync, statSync } from "node:fs";
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
let cachedRegistryPath: string | undefined;
let cachedRegistryMtimeMs: number | undefined;

export function readMintRegistry(): TokenMintRegistry | null {
  const cluster = getSolanaCluster();
  const relative = getMintRegistryPath(cluster);
  const filePath = path.join(process.cwd(), relative);

  if (!existsSync(filePath)) {
    cachedRegistry = null;
    cachedRegistryPath = filePath;
    cachedRegistryMtimeMs = undefined;
    return null;
  }

  const mtimeMs = statSync(filePath).mtimeMs;
  if (
    cachedRegistry !== undefined &&
    cachedRegistryPath === filePath &&
    cachedRegistryMtimeMs === mtimeMs
  ) {
    return cachedRegistry;
  }

  try {
    cachedRegistry = JSON.parse(
      readFileSync(filePath, "utf8"),
    ) as TokenMintRegistry;
    cachedRegistryPath = filePath;
    cachedRegistryMtimeMs = mtimeMs;
    return cachedRegistry;
  } catch {
    cachedRegistry = null;
    cachedRegistryPath = filePath;
    cachedRegistryMtimeMs = mtimeMs;
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

/** Merge mint addresses into catalog/drop tokens when a registry exists. */
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

/** Static catalog claimables only (no published drops). Prefer getClaimableTokensAsync on server. */
export function getClaimableTokens(): KeyboardToken[] {
  return withMintAddresses(keyboardTokens).filter((token) =>
    Boolean(token.mintAddress),
  );
}

/** Catalog + published limited-edition drop tokens that have on-chain mints. */
export async function getClaimableTokensAsync(): Promise<KeyboardToken[]> {
  const { getAllKeyboardTokens } = await import("@/lib/catalog.server");
  const tokens = await getAllKeyboardTokens();
  return withMintAddresses(tokens).filter((token) => Boolean(token.mintAddress));
}
