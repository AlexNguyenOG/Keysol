import { NextResponse } from "next/server";
import { applySecurityHeaders } from "@/lib/security/headers";
import {
  API_RATE_LIMITS,
  checkRateLimit,
  rateLimitHeaders,
  type RateLimitResult,
} from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/request";

export function jsonResponse(
  body: unknown,
  init?: ResponseInit,
): NextResponse {
  const response = NextResponse.json(body, init);
  return applySecurityHeaders(response) as NextResponse;
}

export function enforceRateLimit(
  request: Request,
  routeKey: keyof typeof API_RATE_LIMITS,
): RateLimitResult | NextResponse {
  const config = API_RATE_LIMITS[routeKey];
  const ip = getClientIp(request);
  const result = checkRateLimit(`${routeKey}:${ip}`, config);

  if (!result.allowed) {
    const response = jsonResponse(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
    for (const [key, value] of Object.entries(rateLimitHeaders(result))) {
      response.headers.set(key, value);
    }
    response.headers.set("Retry-After", String(Math.ceil((result.resetAt - Date.now()) / 1000)));
    return response;
  }

  return result;
}

export function withRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult,
): NextResponse {
  for (const [key, value] of Object.entries(rateLimitHeaders(result))) {
    response.headers.set(key, value);
  }
  return response;
}
