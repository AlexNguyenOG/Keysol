/** Shared bearer-token check for cron/admin API routes. */
export function isCronAuthorized(request: Request): boolean {
  const secret =
    process.env.AVAILABILITY_CRON_SECRET ?? process.env.CRON_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return false;
    }

    return process.env.ALLOW_INSECURE_CRON === "true";
  }

  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}
