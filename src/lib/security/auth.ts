import { timingSafeEqual } from "node:crypto";

function readBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

function secretsEqual(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

function allowInsecureDevCron(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  return process.env.ALLOW_INSECURE_CRON === "true";
}

function getCronSecret(): string | undefined {
  return (
    process.env.AVAILABILITY_CRON_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    undefined
  );
}

function getAdminSecret(): string | undefined {
  return (
    process.env.ADMIN_API_SECRET?.trim() ||
    getCronSecret()
  );
}

/** Authorize Vercel cron / availability refresh workers. */
export function isCronAuthorized(request: Request): boolean {
  const secret = getCronSecret();

  if (!secret) {
    return allowInsecureDevCron();
  }

  const token = readBearerToken(request);
  return token !== null && secretsEqual(token, secret);
}

/**
 * Authorize admin drop APIs.
 * Prefers ADMIN_API_SECRET; falls back to the cron secret so existing deploys keep working.
 */
export function isAdminAuthorized(request: Request): boolean {
  const secret = getAdminSecret();

  if (!secret) {
    return allowInsecureDevCron();
  }

  const token = readBearerToken(request);
  return token !== null && secretsEqual(token, secret);
}
