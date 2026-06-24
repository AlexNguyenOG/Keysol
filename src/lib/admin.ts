import type { SessionClaims } from "@/lib/auth/session";
import { getSessionFromCookies } from "@/lib/auth/session";
import { jsonResponse } from "@/lib/security/api";

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  return getAdminEmails().includes(email.trim().toLowerCase());
}

export async function requireAdminSession(): Promise<
  SessionClaims | Response
> {
  const session = await getSessionFromCookies();
  if (!session) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminEmail(session.email)) {
    return jsonResponse({ error: "Forbidden" }, { status: 403 });
  }

  return session;
}
