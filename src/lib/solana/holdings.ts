import "server-only";

import {
  address,
  createSolanaRpc,
  type Address,
} from "@solana/kit";
import { getSolanaRpcUrl } from "@/lib/solana/cluster";
import { getClaimableTokensAsync } from "@/lib/solana/mints";

export interface OnChainHolding {
  keyboardId: string;
  mintAddress: string;
  amount: number;
  tokenAccount: string;
}

export async function fetchOnChainHoldings(
  walletAddress: string,
): Promise<OnChainHolding[]> {
  const claimable = (await getClaimableTokensAsync()).filter(
    (token) => token.mintAddress,
  );
  if (claimable.length === 0) {
    return [];
  }

  const rpc = createSolanaRpc(getSolanaRpcUrl());
  const owner = address(walletAddress) as Address;
  const holdings: OnChainHolding[] = [];

  // Batch by mint — one RPC call per mint keeps parsing simple and reliable.
  for (const token of claimable) {
    try {
      const result = await rpc
        .getTokenAccountsByOwner(
          owner,
          { mint: address(token.mintAddress!) as Address },
          { encoding: "jsonParsed" },
        )
        .send();

      for (const entry of result.value) {
        const parsed = entry.account.data;
        const info =
          typeof parsed === "object" &&
          parsed !== null &&
          "parsed" in parsed
            ? (parsed as {
                parsed?: {
                  info?: {
                    tokenAmount?: { uiAmount?: number | null; amount?: string };
                  };
                };
              }).parsed?.info
            : undefined;

        const amount =
          info?.tokenAmount?.uiAmount ??
          Number(info?.tokenAmount?.amount ?? 0);

        if (amount > 0) {
          holdings.push({
            keyboardId: token.keyboardId,
            mintAddress: token.mintAddress!,
            amount,
            tokenAccount: String(entry.pubkey),
          });
        }
      }
    } catch {
      // Ignore individual mint lookup failures; other holdings can still return.
    }
  }

  return holdings;
}
