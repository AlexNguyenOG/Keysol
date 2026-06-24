import { appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";

export type AuthAuditEvent =
  | "signup_success"
  | "signup_failed"
  | "login_success"
  | "login_failed"
  | "logout"
  | "password_reset_requested"
  | "password_reset_success"
  | "email_verified"
  | "verification_resent";

interface AuthAuditRecord {
  event: AuthAuditEvent;
  at: string;
  ip: string;
  email?: string;
  userId?: string;
  detail?: string;
}

const DEFAULT_AUDIT_PATH = path.join(process.cwd(), "data", "auth-audit.log");

function getAuditPath(): string {
  return process.env.AUTH_AUDIT_LOG_PATH ?? DEFAULT_AUDIT_PATH;
}

export function logAuthEvent(record: Omit<AuthAuditRecord, "at">): void {
  const line = JSON.stringify({
    ...record,
    at: new Date().toISOString(),
  });

  if (process.env.NODE_ENV !== "production") {
    console.info(`[auth-audit] ${line}`);
  }

  try {
    const auditPath = getAuditPath();
    mkdirSync(path.dirname(auditPath), { recursive: true });
    appendFileSync(auditPath, `${line}\n`, "utf8");
  } catch {
    // Audit logging must never break auth flows.
  }
}
