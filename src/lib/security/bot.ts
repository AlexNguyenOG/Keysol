/** Heuristics for blocking obvious automated abuse on auth endpoints. */
export function isSuspiciousBot(request: Request): boolean {
  const userAgent = request.headers.get("user-agent")?.trim();

  if (!userAgent || userAgent.length < 12) {
    return true;
  }

  const lower = userAgent.toLowerCase();
  const blockedAgents = [
    "curl/",
    "wget/",
    "python-requests",
    "scrapy/",
    "httpclient/",
    "libwww-perl",
  ];

  return blockedAgents.some((agent) => lower.includes(agent));
}
