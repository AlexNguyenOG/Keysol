import { NextResponse } from "next/server";
import { enforceAuthRateLimit, finishAuthResponse, auditAuth } from "@/lib/auth/api";
import {
  clearSessionCookie,
  getSessionFromCookies,
} from "@/lib/auth/session";
import { revokeSession } from "@/lib/auth/sessions";
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

export async function POST(request: Request) {
  const rate = enforceAuthRateLimit(request, "logout");
  if (rate instanceof NextResponse) {
    return rate;
  }

  const session = await getSessionFromCookies();
  if (session) {
    revokeSession(session.sessionId);
    auditAuth(request, "logout", {
      email: session.email,
      userId: session.id,
    });
  }

  const response = jsonResponse({ ok: true });
  return finish(clearSessionCookie(response), rate);
}
