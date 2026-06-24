import { NextResponse } from "next/server";
import { enforceAuthRateLimit, finishAuthResponse } from "@/lib/auth/api";
import { getSessionFromCookies } from "@/lib/auth/session";
import { jsonResponse } from "@/lib/security/api";
import type { RateLimitResult } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function finish(
  response: NextResponse,
  rate: RateLimitResult,
): NextResponse {
  return finishAuthResponse(response, rate);
}

export async function GET(request: Request) {
  const rate = enforceAuthRateLimit(request, "session");
  if (rate instanceof NextResponse) {
    return rate;
  }

  const session = await getSessionFromCookies();
  const user = session
    ? {
        id: session.id,
        email: session.email,
        name: session.name,
        emailVerified: session.emailVerified,
      }
    : null;

  return finish(jsonResponse({ user }), rate);
}
