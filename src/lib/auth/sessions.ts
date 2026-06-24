import { randomUUID } from "node:crypto";
import { getAuthDb } from "@/lib/auth/db";

const SESSION_DURATION_MS = 60 * 60 * 24 * 30 * 1000;

function purgeExpiredSessions(): void {
  const db = getAuthDb();
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());
}

export function createSession(userId: string): string {
  purgeExpiredSessions();

  const sessionId = randomUUID();
  const now = Date.now();

  getAuthDb()
    .prepare(
      `
      INSERT INTO sessions (id, user_id, expires_at, created_at)
      VALUES (?, ?, ?, ?)
    `,
    )
    .run(sessionId, userId, now + SESSION_DURATION_MS, now);

  return sessionId;
}

export function sessionExists(sessionId: string): boolean {
  purgeExpiredSessions();

  const row = getAuthDb()
    .prepare(
      `
      SELECT id
      FROM sessions
      WHERE id = ? AND expires_at > ?
    `,
    )
    .get(sessionId, Date.now()) as { id: string } | undefined;

  return Boolean(row);
}

export function revokeSession(sessionId: string): void {
  getAuthDb().prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
}

export function revokeAllSessionsForUser(userId: string): void {
  getAuthDb().prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}
