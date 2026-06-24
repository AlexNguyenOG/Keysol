import { NextResponse } from "next/server";
import { enforceAuthRateLimit, finishAuthResponse, auditAuth } from "@/lib/auth/api";
import {
  applySessionCookie,
  clearSessionCookie,
  createSessionToken,
} from "@/lib/auth/session";
import { createSession, revokeAllSessionsForUser } from "@/lib/auth/sessions";
import { consumeAuthToken } from "@/lib/auth/tokens";
import { findUserById, toPublicUser, updateUserPassword } from "@/lib/auth/users";
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
  const rate = enforceAuthRateLimit(request, "reset-password");
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

  const token =
    "token" in body && typeof body.token === "string" ? body.token.trim() : "";
  const password =
    "password" in body && typeof body.password === "string" ? body.password : "";

  if (!token) {
    return finish(
      jsonResponse({ error: "Reset token is required." }, { status: 400 }),
      rate,
    );
  }

  const userId = consumeAuthToken(token, "reset_password");
  if (!userId) {
    return finish(
      jsonResponse({ error: "Invalid or expired reset link." }, { status: 400 }),
      rate,
    );
  }

  const updated = await updateUserPassword(userId, password);
  if (!updated.ok) {
    return finish(jsonResponse({ error: updated.error }, { status: 400 }), rate);
  }

  revokeAllSessionsForUser(userId);
  const user = findUserById(userId);
  if (!user) {
    const response = jsonResponse({ ok: true });
    return finish(clearSessionCookie(response), rate);
  }

  auditAuth(request, "password_reset_success", {
    email: user.email,
    userId: user.id,
  });

  const publicUser = toPublicUser(user);
  const sessionId = createSession(user.id);
  const sessionToken = await createSessionToken(publicUser, sessionId);
  const response = jsonResponse({ user: publicUser });
  return finish(applySessionCookie(response, sessionToken), rate);
}
