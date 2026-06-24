import { NextResponse } from "next/server";
import { enforceAuthRateLimit, finishAuthResponse, auditAuth } from "@/lib/auth/api";
import { sendVerificationEmail } from "@/lib/auth/email";
import { getSessionFromCookies } from "@/lib/auth/session";
import { createAuthToken } from "@/lib/auth/tokens";
import { findUserById } from "@/lib/auth/users";
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
  const rate = enforceAuthRateLimit(request, "resend-verification");
  if (rate instanceof NextResponse) {
    return rate;
  }

  const session = await getSessionFromCookies();
  if (!session) {
    return finish(jsonResponse({ error: "Unauthorized" }, { status: 401 }), rate);
  }

  const user = findUserById(session.id);
  if (!user) {
    return finish(jsonResponse({ error: "Unauthorized" }, { status: 401 }), rate);
  }

  if (user.emailVerified) {
    return finish(jsonResponse({ message: "Email is already verified." }), rate);
  }

  const token = createAuthToken(user.id, "verify_email");
  await sendVerificationEmail(user.email, token);

  auditAuth(request, "verification_resent", {
    email: user.email,
    userId: user.id,
  });

  return finish(
    jsonResponse({ message: "Verification email sent." }),
    rate,
  );
}
