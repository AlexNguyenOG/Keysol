#!/usr/bin/env node
/**
 * Fails CI when required production secrets are missing.
 */
const required = ["AUTH_SECRET"];

const missing = required.filter((name) => !process.env[name]?.trim());

if (missing.length > 0) {
  console.error(
    `Missing required production environment variables: ${missing.join(", ")}`,
  );
  process.exit(1);
}

console.log("Production environment checks passed.");
