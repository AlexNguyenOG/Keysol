import { NextResponse } from "next/server";
import { claimDevnetToken } from "@/lib/solana/claim";
import { consumeAndVerifyClaimSignature } from "@/lib/solana/challenge";
import { isDevnetClaimEnabled } from "@/lib/solana/cluster";
import {
  enforceRateLimit,
  jsonResponse,
  withRateLimitHeaders,
} from "@/lib/security/api";
import type { RateLimitResult } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!isDevnetClaimEnabled()) {
    return jsonResponse(
      { error: "Token claims are disabled" },
      { status: 403 },
    );
  }

  const rate = enforceRateLimit(request, "tokenClaim");
  if (rate instanceof NextResponse) {
    return rate;
  }

  let body: {
    walletAddress?: string;
    keyboardId?: string;
    challengeId?: string;
    message?: string;
    signature?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    !body.walletAddress ||
    !body.keyboardId ||
    !body.challengeId ||
    !body.message ||
    !body.signature
  ) {
    return jsonResponse(
      {
        error:
          "walletAddress, keyboardId, challengeId, message, and signature are required",
      },
      { status: 400 },
    );
  }

  const verified = await consumeAndVerifyClaimSignature({
    challengeId: body.challengeId,
    walletAddress: body.walletAddress.trim(),
    keyboardId: body.keyboardId.trim(),
    message: body.message,
    signatureBase58: body.signature,
  });

  if (!verified.ok) {
    return withRateLimitHeaders(
      jsonResponse({ error: verified.error }, { status: 401 }),
      rate as RateLimitResult,
    );
  }

  try {
    const result = await claimDevnetToken({
      walletAddress: body.walletAddress,
      keyboardId: body.keyboardId,
    });

    if (!result.ok) {
      return withRateLimitHeaders(
        jsonResponse({ error: result.error }, { status: result.status }),
        rate as RateLimitResult,
      );
    }

    return withRateLimitHeaders(
      jsonResponse({
        signature: result.signature,
        mintAddress: result.mintAddress,
        keyboardId: result.keyboardId,
        symbol: result.symbol,
        simulated: result.simulated ?? false,
        mintAuthorityRevoked: result.mintAuthorityRevoked ?? false,
        revokeSignature: result.revokeSignature ?? null,
      }),
      rate as RateLimitResult,
    );
  } catch (error) {
    console.error("token claim failed", error);
    return withRateLimitHeaders(
      jsonResponse(
        {
          error:
            error instanceof Error ? error.message : "Claim transaction failed",
        },
        { status: 500 },
      ),
      rate as RateLimitResult,
    );
  }
}
