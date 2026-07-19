import { NextResponse } from "next/server";
import { issueKeyboardClaimChallenge } from "@/lib/solana/challenge";
import { isDevnetClaimEnabled } from "@/lib/solana/cluster";
import {
  enforceRateLimit,
  jsonResponse,
  withRateLimitHeaders,
} from "@/lib/security/api";
import type { RateLimitResult } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isDevnetClaimEnabled()) {
    return jsonResponse(
      { error: "Token claims are disabled" },
      { status: 403 },
    );
  }

  const rate = enforceRateLimit(request, "tokenChallenge");
  if (rate instanceof NextResponse) {
    return rate;
  }

  let body: { walletAddress?: string; keyboardId?: string };
  try {
    body = (await request.json()) as {
      walletAddress?: string;
      keyboardId?: string;
    };
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.walletAddress || !body.keyboardId) {
    return jsonResponse(
      { error: "walletAddress and keyboardId are required" },
      { status: 400 },
    );
  }

  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(body.walletAddress)) {
    return jsonResponse({ error: "Invalid wallet address" }, { status: 400 });
  }

  const challenge = await issueKeyboardClaimChallenge({
    walletAddress: body.walletAddress.trim(),
    keyboardId: body.keyboardId.trim(),
  });

  return withRateLimitHeaders(jsonResponse(challenge), rate as RateLimitResult);
}
