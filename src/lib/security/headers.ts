/** HTTP security headers applied to all KeySol responses. */
export const SECURITY_HEADERS_BASE: Record<string, string> = {
  "X-DNS-Prefetch-Control": "on",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-site",
};

export function buildContentSecurityPolicy(isDevelopment: boolean): string {
  const scriptSrc = isDevelopment
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";

  const directives = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' ws: wss:",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];

  if (!isDevelopment) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

export function getSecurityHeaders(
  isDevelopment = process.env.NODE_ENV !== "production",
): Record<string, string> {
  return {
    ...SECURITY_HEADERS_BASE,
    "Content-Security-Policy": buildContentSecurityPolicy(isDevelopment),
  };
}

/** @deprecated Use getSecurityHeaders() for environment-aware CSP. */
export const SECURITY_HEADERS: Record<string, string> = getSecurityHeaders(false);

export function applySecurityHeaders(response: Response): Response {
  const isDevelopment = process.env.NODE_ENV !== "production";
  const headers = getSecurityHeaders(isDevelopment);

  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  if (!isDevelopment) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  return response;
}
