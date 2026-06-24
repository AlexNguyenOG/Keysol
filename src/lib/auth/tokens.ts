import { createHash, randomBytes } from "node:crypto";
import { getAuthDb } from "@/lib/auth/db";
import type { AuthTokenType } from "@/lib/auth/types";

const TOKEN_TTL_MS: Record<AuthTokenType, number> = {
  verify_email: 24 * 60 * 60 * 1000,
  reset_password: 60 * 60 * 1000,
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function purgeExpiredTokens(): void {
  getAuthDb().prepare("DELETE FROM auth_tokens WHERE expires_at <= ?").run(
    Date.now(),
  );
}

export function createAuthToken(
  userId: string,
  tokenType: AuthTokenType,
): string {
  purgeExpiredTokens();

  getAuthDb()
    .prepare("DELETE FROM auth_tokens WHERE user_id = ? AND token_type = ?")
    .run(userId, tokenType);

  const token = randomBytes(32).toString("hex");
  const now = Date.now();

  getAuthDb()
    .prepare(
      `
      INSERT INTO auth_tokens (id, user_id, token_hash, token_type, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    )
    .run(
      randomBytes(16).toString("hex"),
      userId,
      hashToken(token),
      tokenType,
      now + TOKEN_TTL_MS[tokenType],
      now,
    );

  return token;
}

export function consumeAuthToken(
  token: string,
  tokenType: AuthTokenType,
): string | null {
  purgeExpiredTokens();

  const row = getAuthDb()
    .prepare(
      `
      SELECT user_id
      FROM auth_tokens
      WHERE token_hash = ? AND token_type = ? AND expires_at > ?
    `,
    )
    .get(hashToken(token), tokenType, Date.now()) as
    | { user_id: string }
    | undefined;

  if (!row) {
    return null;
  }

  getAuthDb()
    .prepare("DELETE FROM auth_tokens WHERE token_hash = ?")
    .run(hashToken(token));

  return row.user_id;
}
