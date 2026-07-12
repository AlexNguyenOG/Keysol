import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy } from "@/lib/security/headers";
import { isAdminAuthorized, isCronAuthorized } from "@/lib/security/auth";
import { getClientIp } from "@/lib/security/request";
import {
  checkRateLimit,
  resetRateLimitsForTests,
} from "@/lib/security/rate-limit";
import { isSuspiciousBot } from "@/lib/security/bot";
import { isPublicHttpUrl } from "@/lib/security/url";

describe("security headers", () => {
  it("allows unsafe-eval in development CSP only", () => {
    expect(buildContentSecurityPolicy(true)).toContain("'unsafe-eval'");
    expect(buildContentSecurityPolicy(false)).not.toContain("'unsafe-eval'");
  });

  it("adds upgrade-insecure-requests in production CSP", () => {
    expect(buildContentSecurityPolicy(false)).toContain(
      "upgrade-insecure-requests",
    );
    expect(buildContentSecurityPolicy(true)).not.toContain(
      "upgrade-insecure-requests",
    );
  });
});

describe("security url guard", () => {
  it("allows public https retailer urls", () => {
    expect(isPublicHttpUrl("https://wooting.io/wooting-60he")).toBe(true);
    expect(isPublicHttpUrl("https://www.corsair.com/us/en/p/keyboards")).toBe(
      true,
    );
  });

  it("blocks private and non-http urls", () => {
    expect(isPublicHttpUrl("http://127.0.0.1/admin")).toBe(false);
    expect(isPublicHttpUrl("http://127.1/admin")).toBe(false);
    expect(isPublicHttpUrl("http://2130706433/admin")).toBe(false);
    expect(isPublicHttpUrl("http://localhost:3000")).toBe(false);
    expect(isPublicHttpUrl("http://192.168.1.1")).toBe(false);
    expect(isPublicHttpUrl("http://172.16.0.1")).toBe(false);
    expect(isPublicHttpUrl("http://172.31.255.255")).toBe(false);
    expect(isPublicHttpUrl("http://10.0.0.5")).toBe(false);
    expect(isPublicHttpUrl("http://100.64.0.1")).toBe(false);
    expect(isPublicHttpUrl("http://169.254.169.254/latest/meta-data/")).toBe(
      false,
    );
    expect(isPublicHttpUrl("http://[::1]/admin")).toBe(false);
    expect(isPublicHttpUrl("http://[::ffff:127.0.0.1]/admin")).toBe(false);
    expect(isPublicHttpUrl("file:///etc/passwd")).toBe(false);
    expect(isPublicHttpUrl("not-a-url")).toBe(false);
  });

  it("can require https only", () => {
    expect(isPublicHttpUrl("http://wooting.io/wooting-60he", { httpsOnly: true })).toBe(
      false,
    );
    expect(
      isPublicHttpUrl("https://wooting.io/wooting-60he", { httpsOnly: true }),
    ).toBe(true);
  });
});

describe("security rate limit", () => {
  it("blocks after the configured limit", () => {
    resetRateLimitsForTests();
    const options = { limit: 3, windowMs: 60_000 };

    expect(checkRateLimit("test-ip", options).allowed).toBe(true);
    expect(checkRateLimit("test-ip", options).allowed).toBe(true);
    expect(checkRateLimit("test-ip", options).allowed).toBe(true);
    expect(checkRateLimit("test-ip", options).allowed).toBe(false);
  });
});

describe("security client ip", () => {
  it("does not trust proxy headers by default", () => {
    const request = new Request("http://localhost/api/auth/login", {
      headers: { "x-forwarded-for": "203.0.113.10" },
    });

    const originalVercel = process.env.VERCEL;
    const originalTrust = process.env.TRUST_PROXY_HEADERS;
    delete process.env.VERCEL;
    delete process.env.TRUST_PROXY_HEADERS;

    expect(getClientIp(request)).toBe("untrusted");

    process.env.VERCEL = originalVercel;
    process.env.TRUST_PROXY_HEADERS = originalTrust;
  });

  it("trusts proxy headers on vercel", () => {
    const request = new Request("http://localhost/api/auth/login", {
      headers: { "x-forwarded-for": "203.0.113.10, 10.0.0.1" },
    });

    const originalVercel = process.env.VERCEL;
    process.env.VERCEL = "1";

    expect(getClientIp(request)).toBe("203.0.113.10");

    process.env.VERCEL = originalVercel;
  });
});

describe("security bot heuristics", () => {
  it("blocks missing and script user agents", () => {
    const missing = new Request("http://localhost/api/auth/login");
    expect(isSuspiciousBot(missing)).toBe(true);

    const curl = new Request("http://localhost/api/auth/login", {
      headers: { "user-agent": "curl/8.0" },
    });
    expect(isSuspiciousBot(curl)).toBe(true);

    const browser = new Request("http://localhost/api/auth/login", {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });
    expect(isSuspiciousBot(browser)).toBe(false);
  });
});

describe("security cron auth", () => {
  it("requires bearer secret in production when configured", () => {
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      AVAILABILITY_CRON_SECRET: "test-secret",
    };

    const unauthorized = new Request("http://localhost/api/availability/refresh", {
      method: "POST",
    });
    expect(isCronAuthorized(unauthorized)).toBe(false);

    const authorized = new Request("http://localhost/api/availability/refresh", {
      method: "POST",
      headers: { authorization: "Bearer test-secret" },
    });
    expect(isCronAuthorized(authorized)).toBe(true);

    process.env = originalEnv;
  });

  it("requires explicit dev opt-in when cron secret is missing", () => {
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      NODE_ENV: "development",
    };
    delete process.env.AVAILABILITY_CRON_SECRET;
    delete process.env.CRON_SECRET;
    delete process.env.ALLOW_INSECURE_CRON;

    const request = new Request("http://localhost/api/availability/refresh", {
      method: "POST",
    });
    expect(isCronAuthorized(request)).toBe(false);

    process.env.ALLOW_INSECURE_CRON = "true";
    expect(isCronAuthorized(request)).toBe(true);

    process.env = originalEnv;
  });

  it("prefers ADMIN_API_SECRET for admin routes", () => {
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      AVAILABILITY_CRON_SECRET: "cron-secret-value-for-tests-32c",
      ADMIN_API_SECRET: "admin-secret-value-for-tests-32c",
    };

    const cronOnly = new Request("http://localhost/api/admin/drops/candidates", {
      headers: { authorization: "Bearer cron-secret-value-for-tests-32c" },
    });
    expect(isAdminAuthorized(cronOnly)).toBe(false);
    expect(isCronAuthorized(cronOnly)).toBe(true);

    const adminOk = new Request("http://localhost/api/admin/drops/candidates", {
      headers: { authorization: "Bearer admin-secret-value-for-tests-32c" },
    });
    expect(isAdminAuthorized(adminOk)).toBe(true);

    process.env = originalEnv;
  });
});
