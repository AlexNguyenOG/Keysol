import { getAuthDb } from "@/lib/auth/db";

interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface PersistedRateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export function checkPersistedRateLimit(
  key: string,
  options: RateLimitOptions,
): PersistedRateLimitResult {
  const db = getAuthDb();
  const now = Date.now();
  const existing = db
    .prepare(
      `
      SELECT count, reset_at
      FROM rate_limits
      WHERE bucket_key = ?
    `,
    )
    .get(key) as { count: number; reset_at: number } | undefined;

  if (!existing || now >= existing.reset_at) {
    const resetAt = now + options.windowMs;
    db.prepare(
      `
      INSERT INTO rate_limits (bucket_key, count, reset_at)
      VALUES (?, 1, ?)
      ON CONFLICT(bucket_key) DO UPDATE SET
        count = excluded.count,
        reset_at = excluded.reset_at
    `,
    ).run(key, resetAt);

    return {
      allowed: true,
      limit: options.limit,
      remaining: options.limit - 1,
      resetAt,
    };
  }

  if (existing.count >= options.limit) {
    return {
      allowed: false,
      limit: options.limit,
      remaining: 0,
      resetAt: existing.reset_at,
    };
  }

  const nextCount = existing.count + 1;
  db.prepare(
    `
    UPDATE rate_limits
    SET count = ?
    WHERE bucket_key = ?
  `,
  ).run(nextCount, key);

  return {
    allowed: true,
    limit: options.limit,
    remaining: options.limit - nextCount,
    resetAt: existing.reset_at,
  };
}

/** @internal Test helper */
export function resetPersistedRateLimitsForTests(): void {
  getAuthDb().prepare("DELETE FROM rate_limits").run();
}
