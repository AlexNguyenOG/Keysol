/** Shared bearer-token check for cron/admin API routes. */
export function isCronAuthorized(request: Request): boolean {
  const secret =
    process.env.AVAILABILITY_CRON_SECRET ?? process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}
