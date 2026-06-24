import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeAuthDbForTests, resetAuthDbForTests } from "@/lib/auth/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { sanitizeCallbackUrl } from "@/lib/auth/redirect";
import { resetPersistedRateLimitsForTests } from "@/lib/auth/rate-limit";
import {
  createSessionToken,
  getAuthSecret,
  verifySessionToken,
} from "@/lib/auth/session";
import {
  createSession,
  revokeSession,
  sessionExists,
} from "@/lib/auth/sessions";
import {
  isValidEmail,
  isValidName,
  isValidPassword,
  normalizeEmail,
} from "@/lib/auth/validation";
import { createUser, findUserByEmail } from "@/lib/auth/users";

describe("auth validation", () => {
  it("normalizes and validates emails", () => {
    expect(normalizeEmail("  User@Example.COM ")).toBe("user@example.com");
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("not-an-email")).toBe(false);
  });

  it("validates password and name lengths", () => {
    expect(isValidPassword("short")).toBe(false);
    expect(isValidPassword("long-enough")).toBe(false);
    expect(isValidPassword("StrongPass1")).toBe(true);
    expect(isValidPassword("password123")).toBe(false);
    expect(isValidName("Alex")).toBe(true);
    expect(isValidName("")).toBe(false);
  });
});

describe("auth redirect", () => {
  it("allows same-origin relative paths only", () => {
    expect(sanitizeCallbackUrl("/rankings")).toBe("/rankings");
    expect(sanitizeCallbackUrl("/rankings?tab=tokens")).toBe(
      "/rankings?tab=tokens",
    );
    expect(sanitizeCallbackUrl("https://evil.com")).toBe("/");
    expect(sanitizeCallbackUrl("//evil.com")).toBe("/");
    expect(sanitizeCallbackUrl("/\\evil.com")).toBe("/");
  });
});

describe("auth password", () => {
  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("keyboard-finder");
    expect(hash).not.toBe("keyboard-finder");
    expect(await verifyPassword("keyboard-finder", hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });
});

describe("auth session", () => {
  let dbPath = "";
  const originalSecret = process.env.AUTH_SECRET;

  beforeEach(() => {
    dbPath = path.join(
      mkdtempSync(path.join(tmpdir(), "keysol-auth-")),
      "auth.db",
    );
    resetAuthDbForTests(dbPath);
    process.env.AUTH_SECRET = "test-auth-secret";
  });

  afterEach(() => {
    closeAuthDbForTests();
    process.env.AUTH_SECRET = originalSecret;
  });

  it("requires AUTH_SECRET in production", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    delete process.env.AUTH_SECRET;

    expect(() => getAuthSecret()).toThrow("AUTH_SECRET must be set in production");

    process.env.NODE_ENV = originalNodeEnv;
    process.env.AUTH_SECRET = "test-auth-secret";
  });

  it("creates, verifies, and revokes session tokens", async () => {
    const created = await createUser({
      name: "Alex",
      email: "user@example.com",
      password: "StrongPass1",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const sessionId = createSession(created.user.id);
    const token = await createSessionToken(created.user, sessionId);

    const session = await verifySessionToken(token);
    expect(session).toEqual({
      id: created.user.id,
      email: "user@example.com",
      name: "Alex",
      emailVerified: false,
      sessionId,
    });

    revokeSession(sessionId);
    expect(sessionExists(sessionId)).toBe(false);
    expect(await verifySessionToken(token)).toBeNull();
  });
});

describe("auth users store", () => {
  let dbPath = "";

  beforeEach(() => {
    dbPath = path.join(
      mkdtempSync(path.join(tmpdir(), "keysol-auth-")),
      "auth.db",
    );
    resetAuthDbForTests(dbPath);
    resetPersistedRateLimitsForTests();
  });

  afterEach(() => {
    closeAuthDbForTests();
  });

  it("creates users and returns a generic duplicate-email error", async () => {
    const first = await createUser({
      name: "Alex",
      email: "alex@example.com",
      password: "StrongPass1",
    });
    expect(first.ok).toBe(true);

    const stored = findUserByEmail("alex@example.com");
    expect(stored?.email).toBe("alex@example.com");

    const duplicate = await createUser({
      name: "Other",
      email: "alex@example.com",
      password: "StrongPass2",
    });
    expect(duplicate.ok).toBe(false);
    if (!duplicate.ok) {
      expect(duplicate.error).toBe(
        "Unable to create account. Check your details or try logging in.",
      );
    }
  });
});
