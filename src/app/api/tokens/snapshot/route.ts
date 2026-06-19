import { NextResponse } from "next/server";
import { getAvailability } from "@/lib/availability/checker";
import { buildTokenSnapshots } from "@/lib/tokens";
import { readTokenValueBaseline } from "@/lib/tokens/baseline";
import {
  enforceRateLimit,
  jsonResponse,
  withRateLimitHeaders,
} from "@/lib/security/api";
import { isCronAuthorized } from "@/lib/security/auth";
import type { RateLimitResult } from "@/lib/security/rate-limit";
import { TOKEN_STOCK_TRUST_MODEL } from "@/lib/tokens/scoring";

export const dynamic = "force-dynamic";

/**
 * Server-only token snapshot: catalog rarity + verified retailer stock.
 * Force refresh requires cron authorization in production.
 */
export async function GET(request: Request) {
  const rate = enforceRateLimit(request, "tokensSnapshot");
  if (rate instanceof NextResponse) {
    return rate;
  }

  const { searchParams } = new URL(request.url);
  const wantsRefresh = searchParams.get("refresh") === "1";

  if (wantsRefresh && !isCronAuthorized(request)) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  const availability = await getAvailability({ refresh: wantsRefresh });
  const snapshotAt = new Date().toISOString();
  const previousScores = await readTokenValueBaseline();
  const snapshots = buildTokenSnapshots(
    availability,
    snapshotAt,
    previousScores,
  );

  const response = jsonResponse({
    trustModel: TOKEN_STOCK_TRUST_MODEL,
    snapshotAt,
    snapshots,
  });
  return withRateLimitHeaders(response, rate as RateLimitResult);
}
