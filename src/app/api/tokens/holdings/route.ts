import { NextResponse } from "next/server";
import { listClaimsForWallet } from "@/lib/solana/claims-store";
import {
  getClusterLabel,
  getSolanaCluster,
  isDevnetClaimEnabled,
} from "@/lib/solana/cluster";
import { fetchOnChainHoldings } from "@/lib/solana/holdings";
import {
  getClaimableTokens,
  getClaimableTokensAsync,
  getMintForKeyboard,
  withMintAddresses,
} from "@/lib/solana/mints";
import { keyboardTokens } from "@/data/keyboard-tokens";
import {
  enforceRateLimit,
  jsonResponse,
  withRateLimitHeaders,
} from "@/lib/security/api";
import type { RateLimitResult } from "@/lib/security/rate-limit";
import type { KeyboardToken } from "@/types";

export const dynamic = "force-dynamic";

async function getAllTokensForSimulation(): Promise<KeyboardToken[]> {
  try {
    const { getAllKeyboardTokens } = await import("@/lib/catalog.server");
    return withMintAddresses(await getAllKeyboardTokens());
  } catch {
    return withMintAddresses(keyboardTokens);
  }
}

export async function GET(request: Request) {
  if (!isDevnetClaimEnabled()) {
    return jsonResponse(
      { error: "Token claims are disabled" },
      { status: 403 },
    );
  }

  const rate = enforceRateLimit(request, "tokenHoldings");
  if (rate instanceof NextResponse) {
    return rate;
  }

  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get("wallet")?.trim();
  const simulation = process.env.TOKEN_CLAIM_SIMULATION === "true";
  const cluster = getSolanaCluster();
  const clusterLabel = getClusterLabel();

  const minted = await getClaimableTokensAsync();
  // Simulation: every catalog/drop token is claimable offline, even if a
  // stale localnet registry still lists mint addresses that no longer exist.
  const claimableSource = simulation
    ? await getAllTokensForSimulation()
    : minted.length > 0
      ? minted
      : getClaimableTokens();

  if (!walletAddress) {
    return withRateLimitHeaders(
      jsonResponse({
        simulation,
        cluster,
        clusterLabel,
        claimable: claimableSource.map((token) => ({
          keyboardId: token.keyboardId,
          symbol: token.symbol,
          mintAddress: token.mintAddress,
          maxSupply: token.maxSupply,
          metadataUri:
            getMintForKeyboard(token.keyboardId)?.metadataUri ??
            `/tokens/metadata/${token.keyboardId}.json`,
        })),
      }),
      rate as RateLimitResult,
    );
  }

  const [claims, onChain] = await Promise.all([
    listClaimsForWallet(walletAddress),
    simulation
      ? Promise.resolve([])
      : fetchOnChainHoldings(walletAddress).catch(() => []),
  ]);

  const onChainByKeyboard = new Map(
    onChain.map((holding) => [holding.keyboardId, holding]),
  );

  return withRateLimitHeaders(
    jsonResponse({
      simulation,
      cluster,
      clusterLabel,
      walletAddress,
      claims,
      onChainHoldings: onChain,
      claimable: claimableSource.map((token) => {
        const chain = onChainByKeyboard.get(token.keyboardId);
        const claimedInDb = claims.some(
          (claim) => claim.keyboardId === token.keyboardId,
        );
        return {
          keyboardId: token.keyboardId,
          symbol: token.symbol,
          mintAddress: token.mintAddress,
          maxSupply: token.maxSupply,
          metadataUri:
            getMintForKeyboard(token.keyboardId)?.metadataUri ??
            `/tokens/metadata/${token.keyboardId}.json`,
          claimed: Boolean(chain) || claimedInDb,
          onChainAmount: chain?.amount ?? 0,
          tokenAccount: chain?.tokenAccount ?? null,
        };
      }),
    }),
    rate as RateLimitResult,
  );
}
