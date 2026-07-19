import "server-only";

import {
  address,
  createSolanaRpc,
  type Address,
} from "@solana/kit";
import { getSolanaCluster, getSolanaRpcUrl } from "@/lib/solana/cluster";
import { getClaimableTokensAsync } from "@/lib/solana/mints";

export interface MintHealthReport {
  ok: boolean;
  cluster: string;
  checked: number;
  missing: Array<{ keyboardId: string; symbol: string; mintAddress: string }>;
  recreateHint: string | null;
}

/** Check whether registered mint accounts still exist on the current RPC. */
export async function checkMintHealth(): Promise<MintHealthReport> {
  const cluster = getSolanaCluster();
  const claimable = await getClaimableTokensAsync();
  const missing: MintHealthReport["missing"] = [];

  if (claimable.length === 0) {
    return {
      ok: true,
      cluster,
      checked: 0,
      missing: [],
      recreateHint:
        cluster === "localnet"
          ? "No localnet mints yet. Run: npm run tokens:localnet:create"
          : cluster === "devnet"
            ? "No Devnet mints in registry. Run: npm run tokens:devnet:create"
            : null,
    };
  }

  const rpc = createSolanaRpc(getSolanaRpcUrl());

  for (const token of claimable) {
    if (!token.mintAddress) {
      continue;
    }
    try {
      const info = await rpc
        .getAccountInfo(address(token.mintAddress) as Address, {
          encoding: "base64",
        })
        .send();
      if (!info.value) {
        missing.push({
          keyboardId: token.keyboardId,
          symbol: token.symbol,
          mintAddress: token.mintAddress,
        });
      }
    } catch {
      missing.push({
        keyboardId: token.keyboardId,
        symbol: token.symbol,
        mintAddress: token.mintAddress,
      });
    }
  }

  const recreateHint =
    missing.length === 0
      ? null
      : cluster === "localnet"
        ? "Surfpool resets wipe mints. Recreate with: rm -f src/data/token-mints.localnet.json && npm run tokens:localnet:create"
        : "Mint accounts missing on RPC. Re-run the mint create script for this cluster.";

  return {
    ok: missing.length === 0,
    cluster,
    checked: claimable.length,
    missing,
    recreateHint,
  };
}
