import { NextResponse } from "next/server";
import { logAuthEvent } from "@/lib/auth/audit";
import { checkPersistedRateLimit } from "@/lib/auth/rate-limit";
import { isSuspiciousBot } from "@/lib/security/bot";
import {
  jsonResponse,
  withRateLimitHeaders,
} from "@/lib/security/api";
import { getClientIp } from "@/lib/security/request";
import type { RateLimitResult } from "@/lib/security/rate-limit";

const AUTH_RATE_LIMIT = { limit: 10, windowMs: 60_000 };

type AuthRateLimitAction =
  | "login"
  | "signup"
  | "logout"
  | "session"
  | "forgot-password"
  | "reset-password"
  | "verify-email"
  | "resend-verification";

export function enforceAuthRateLimit(
  request: Request,
  action: AuthRateLimitAction,
): RateLimitResult | NextResponse {
  if (isSuspiciousBot(request)) {
    return jsonResponse({ error: "Forbidden" }, { status: 403 });
  }

  const ip = getClientIp(request);
  const result = checkPersistedRateLimit(`auth:${action}:${ip}`, AUTH_RATE_LIMIT);

  if (!result.allowed) {
    const response = jsonResponse(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
    for (const [key, value] of Object.entries({
      "X-RateLimit-Limit": String(result.limit),
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    })) {
      response.headers.set(key, value);
    }
    response.headers.set(
      "Retry-After",
      String(Math.ceil((result.resetAt - Date.now()) / 1000)),
    );
    return response;
  }

  return result;
}

export function finishAuthResponse(
  response: NextResponse,
  rate: RateLimitResult,
): NextResponse {
  return withRateLimitHeaders(response, rate);
}

export function auditAuth(
  request: Request,
  event: Parameters<typeof logAuthEvent>[0]["event"],
  details: Omit<Parameters<typeof logAuthEvent>[0], "event" | "ip" | "at"> = {},
): void {
  logAuthEvent({
    event,
    ip: getClientIp(request),
    ...details,
  });
}
