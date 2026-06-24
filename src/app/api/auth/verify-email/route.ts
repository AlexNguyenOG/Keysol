import { NextResponse } from "next/server";
import { enforceAuthRateLimit, finishAuthResponse, auditAuth } from "@/lib/auth/api";
import { consumeAuthToken } from "@/lib/auth/tokens";
import { findUserById, markEmailVerified } from "@/lib/auth/users";
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
  const rate = enforceAuthRateLimit(request, "verify-email");
  if (rate instanceof NextResponse) {
    return rate;
  }

  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim() ?? "";

  if (!token) {
    return finish(
      jsonResponse({ error: "Verification token is required." }, { status: 400 }),
      rate,
    );
  }

  const userId = consumeAuthToken(token, "verify_email");
  if (!userId) {
    return finish(
      jsonResponse({ error: "Invalid or expired verification link." }, { status: 400 }),
      rate,
    );
  }

  const user = findUserById(userId);
  if (!user) {
    return finish(
      jsonResponse({ error: "Account not found." }, { status: 404 }),
      rate,
    );
  }

  markEmailVerified(userId);

  auditAuth(request, "email_verified", {
    email: user.email,
    userId: user.id,
  });

  return finish(
    jsonResponse({
      ok: true,
      email: user.email,
    }),
    rate,
  );
}
