import { NextResponse } from "next/server";
import { enforceAuthRateLimit, finishAuthResponse, auditAuth } from "@/lib/auth/api";
import { normalizeEmail } from "@/lib/auth/validation";
import { verifyPassword } from "@/lib/auth/password";
import {
  applySessionCookie,
  createSessionToken,
} from "@/lib/auth/session";
import { createSession } from "@/lib/auth/sessions";
import { findUserByEmail, toPublicUser } from "@/lib/auth/users";
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
  const rate = enforceAuthRateLimit(request, "login");
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

  const email =
    "email" in body && typeof body.email === "string" ? body.email : "";
  const password =
    "password" in body && typeof body.password === "string" ? body.password : "";

  const user = findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    auditAuth(request, "login_failed", {
      email: normalizeEmail(email),
    });
    return finish(
      jsonResponse({ error: "Invalid email or password." }, { status: 401 }),
      rate,
    );
  }

  const sessionId = createSession(user.id);
  const publicUser = toPublicUser(user);
  const token = await createSessionToken(publicUser, sessionId);

  auditAuth(request, "login_success", {
    email: publicUser.email,
    userId: publicUser.id,
  });

  const response = jsonResponse({ user: publicUser });
  return finish(applySessionCookie(response, token), rate);
}
