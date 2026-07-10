interface RateLimitBucket {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitBucket>();

/** In-memory sliding window limiter (per server instance). */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    const resetAt = now + options.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      limit: options.limit,
      remaining: options.limit - 1,
      resetAt,
    };
  }

  if (bucket.count >= options.limit) {
    return {
      allowed: false,
      limit: options.limit,
      remaining: 0,
      resetAt: bucket.resetAt,
    };
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  return {
    allowed: true,
    limit: options.limit,
    remaining: options.limit - bucket.count,
    resetAt: bucket.resetAt,
  };
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(Math.max(0, result.remaining)),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}

export const API_RATE_LIMITS = {
  assistant: { limit: 20, windowMs: 60_000 },
  availability: { limit: 60, windowMs: 60_000 },
  tokensSnapshot: { limit: 30, windowMs: 60_000 },
} as const;

/** @internal Test helper */
export function resetRateLimitsForTests(): void {
  buckets.clear();
}
