import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy } from "@/lib/security/headers";
import { isCronAuthorized } from "@/lib/security/auth";
import {
  checkRateLimit,
  resetRateLimitsForTests,
} from "@/lib/security/rate-limit";
import { isPublicHttpUrl } from "@/lib/security/url";

describe("security headers", () => {
  it("allows unsafe-eval in development CSP only", () => {
    expect(buildContentSecurityPolicy(true)).toContain("'unsafe-eval'");
    expect(buildContentSecurityPolicy(false)).not.toContain("'unsafe-eval'");
  });
});

describe("security url guard", () => {
  it("allows public https retailer urls", () => {
    expect(isPublicHttpUrl("https://wooting.io/wooting-60he")).toBe(true);
    expect(isPublicHttpUrl("https://www.corsair.com/us/en/p/keyboards")).toBe(true);
  });

  it("blocks private and non-http urls", () => {
    expect(isPublicHttpUrl("http://127.0.0.1/admin")).toBe(false);
    expect(isPublicHttpUrl("http://localhost:3000")).toBe(false);
    expect(isPublicHttpUrl("http://192.168.1.1")).toBe(false);
    expect(isPublicHttpUrl("file:///etc/passwd")).toBe(false);
    expect(isPublicHttpUrl("not-a-url")).toBe(false);
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
});
