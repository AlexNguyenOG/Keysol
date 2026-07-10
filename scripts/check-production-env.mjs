#!/usr/bin/env node
/**
 * Fails CI when required production secrets are missing.
 */
const required = ["AVAILABILITY_CRON_SECRET"];

if (process.env.VERCEL === "1" || process.env.REQUIRE_TURSO === "true") {
  required.push("TURSO_DATABASE_URL", "TURSO_AUTH_TOKEN");
}

const missing = required.filter((name) => !process.env[name]?.trim());

if (missing.length > 0) {
  console.error(
    `Missing required production environment variables: ${missing.join(", ")}`,
  );
  process.exit(1);
}

console.log("Production environment checks passed.");
