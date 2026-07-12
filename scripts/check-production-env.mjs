#!/usr/bin/env node
/**
 * Fails CI when required production secrets are missing or misconfigured.
 */
const MIN_SECRET_LENGTH = 32;

const required = ["AVAILABILITY_CRON_SECRET", "TURSO_DATABASE_URL", "TURSO_AUTH_TOKEN"];

const missing = required.filter((name) => !process.env[name]?.trim());

if (missing.length > 0) {
  console.error(
    `Missing required production environment variables: ${missing.join(", ")}`,
  );
  process.exit(1);
}

if (process.env.ALLOW_INSECURE_CRON === "true") {
  console.error(
    "ALLOW_INSECURE_CRON must not be enabled in production checks.",
  );
  process.exit(1);
}

const cronSecret = process.env.AVAILABILITY_CRON_SECRET?.trim() ?? "";
if (cronSecret.length < MIN_SECRET_LENGTH) {
  console.error(
    `AVAILABILITY_CRON_SECRET must be at least ${MIN_SECRET_LENGTH} characters.`,
  );
  process.exit(1);
}

const adminSecret = process.env.ADMIN_API_SECRET?.trim();
if (adminSecret && adminSecret.length < MIN_SECRET_LENGTH) {
  console.error(
    `ADMIN_API_SECRET must be at least ${MIN_SECRET_LENGTH} characters when set.`,
  );
  process.exit(1);
}

if (
  process.env.TURSO_DATABASE_URL?.trim() &&
  !process.env.TURSO_AUTH_TOKEN?.trim()
) {
  console.error("TURSO_AUTH_TOKEN is required when TURSO_DATABASE_URL is set.");
  process.exit(1);
}

console.log("Production environment checks passed.");
