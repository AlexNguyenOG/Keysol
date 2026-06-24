import { NextResponse } from "next/server";
import { enforceAuthRateLimit, finishAuthResponse, auditAuth } from "@/lib/auth/api";
import { normalizeEmail } from "@/lib/auth/validation";
import { sendVerificationEmail } from "@/lib/auth/email";
import {
  applySessionCookie,
  createSessionToken,
} from "@/lib/auth/session";
import { createSession } from "@/lib/auth/sessions";
import { createAuthToken } from "@/lib/auth/tokens";
import { createUser } from "@/lib/auth/users";
import { jsonResponse } from "@/lib/security/api";
import { readJsonBody } from "@/lib/security/request";
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
  const rate = enforceAuthRateLimit(request, "signup");
  if (rate instanceof NextResponse) {
    return rate;
  }

  const parsed = await readJsonBody(request);
  if (!parsed.ok) {
    return finish(jsonResponse({ error: parsed.error }, { status: 400 }), rate);
  }

  const body = parsed.data;
  if (!body || typeof body !== "object") {
    return finish(
      jsonResponse({ error: "Invalid request body." }, { status: 400 }),
      rate,
    );
  }

  const name =
    "name" in body && typeof body.name === "string" ? body.name : "";
  const email =
    "email" in body && typeof body.email === "string" ? body.email : "";
  const password =
    "password" in body && typeof body.password === "string" ? body.password : "";

  const result = await createUser({ name, email, password });
  if (!result.ok) {
    auditAuth(request, "signup_failed", {
      email: normalizeEmail(email),
      detail: result.error,
    });
    return finish(jsonResponse({ error: result.error }, { status: 400 }), rate);
  }

  const sessionId = createSession(result.user.id);
  const token = await createSessionToken(result.user, sessionId);
  const verificationToken = createAuthToken(result.user.id, "verify_email");
  await sendVerificationEmail(result.user.email, verificationToken);

  auditAuth(request, "signup_success", {
    email: result.user.email,
    userId: result.user.id,
  });

  const response = jsonResponse({
    user: result.user,
    verificationEmailSent: true,
  });
  return finish(applySessionCookie(response, token), rate);
}
