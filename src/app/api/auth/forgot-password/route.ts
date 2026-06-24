import { NextResponse } from "next/server";
import { enforceAuthRateLimit, finishAuthResponse, auditAuth } from "@/lib/auth/api";
import { normalizeEmail } from "@/lib/auth/validation";
import { sendPasswordResetEmail } from "@/lib/auth/email";
import { createAuthToken } from "@/lib/auth/tokens";
import { findUserByEmail } from "@/lib/auth/users";
import { jsonResponse } from "@/lib/security/api";
import { readJsonBody } from "@/lib/security/request";
import type { RateLimitResult } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const GENERIC_MESSAGE =
  "If an account exists for that email, password reset instructions were sent.";

function finish(
  response: NextResponse,
  rate: RateLimitResult,
): NextResponse {
  return finishAuthResponse(response, rate);
}

export async function POST(request: Request) {
  const rate = enforceAuthRateLimit(request, "forgot-password");
  if (rate instanceof NextResponse) {
    return rate;
  }

  const parsed = await readJsonBody(request);
  if (!parsed.ok) {
    return finish(jsonResponse({ error: parsed.error }, { status: 400 }), rate);
  }

  const body = parsed.data;
  const email =
    body &&
    typeof body === "object" &&
    "email" in body &&
    typeof body.email === "string"
      ? body.email
      : "";

  const user = findUserByEmail(email);
  if (user) {
    const token = createAuthToken(user.id, "reset_password");
    await sendPasswordResetEmail(user.email, token);
    auditAuth(request, "password_reset_requested", {
      email: user.email,
      userId: user.id,
    });
  } else {
    auditAuth(request, "password_reset_requested", {
      email: normalizeEmail(email),
    });
  }

  return finish(jsonResponse({ message: GENERIC_MESSAGE }), rate);
}
