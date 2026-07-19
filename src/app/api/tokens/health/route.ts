import { NextResponse } from "next/server";
import { isDevnetClaimEnabled } from "@/lib/solana/cluster";
import { checkMintHealth } from "@/lib/solana/mint-health";
import {
  enforceRateLimit,
  jsonResponse,
  withRateLimitHeaders,
} from "@/lib/security/api";
import type { RateLimitResult } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

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

  try {
    const health = await checkMintHealth();
    return withRateLimitHeaders(jsonResponse(health), rate as RateLimitResult);
  } catch (error) {
    return withRateLimitHeaders(
      jsonResponse(
        {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Could not reach Solana RPC (is Surfpool running?)",
          recreateHint:
            "Start Surfpool with npm run surfpool:start, then npm run tokens:localnet:create",
        },
        { status: 503 },
      ),
      rate as RateLimitResult,
    );
  }
}
