import { existsSync, mkdirSync, unlinkSync } from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";

const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "app.db");

let client: Client | null = null;
let schemaReady: Promise<void> | null = null;
let unavailableReason: string | null = null;

function resolveDatabaseUrl(): { url: string; authToken?: string } | null {
  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
  const tursoToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (tursoUrl) {
    return { url: tursoUrl, authToken: tursoToken };
  }

  if (process.env.VERCEL === "1") {
    unavailableReason =
      "TURSO_DATABASE_URL is required on Vercel so drop candidates and published drops persist across serverless instances.";
    return null;
  }

  const filePath = process.env.APP_DATABASE_PATH ?? DEFAULT_DB_PATH;
  mkdirSync(path.dirname(filePath), { recursive: true });
  return { url: `file:${filePath}` };
}

async function initializeSchema(db: Client): Promise<void> {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS drop_candidates (
      id TEXT PRIMARY KEY,
      brand_id TEXT NOT NULL,
      name TEXT NOT NULL,
      source_url TEXT NOT NULL UNIQUE,
      purchase_url TEXT,
      detection_source TEXT NOT NULL,
      signals TEXT NOT NULL,
      confidence REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      raw_snippet TEXT,
      detected_at INTEGER NOT NULL,
      reviewed_at INTEGER,
      reviewed_by TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_drop_candidates_status ON drop_candidates(status);

    CREATE TABLE IF NOT EXISTS published_drops (
      keyboard_id TEXT PRIMARY KEY,
      candidate_id TEXT,
      keyboard_json TEXT NOT NULL,
      token_json TEXT NOT NULL,
      featured_order INTEGER NOT NULL DEFAULT 0,
      featured_at INTEGER NOT NULL,
      approved_by TEXT NOT NULL
    );
  `);
}

/** Returns null when no durable DB is configured (e.g. Vercel without Turso). */
export async function getAppDb(): Promise<Client | null> {
  if (unavailableReason && !process.env.TURSO_DATABASE_URL?.trim()) {
    return null;
  }

  if (!client) {
    const config = resolveDatabaseUrl();
    if (!config) {
      return null;
    }

    client = createClient(config);
    schemaReady = initializeSchema(client);
  }

  await schemaReady;
  return client;
}

export function getAppDbUnavailableReason(): string | null {
  if (process.env.TURSO_DATABASE_URL?.trim()) {
    return null;
  }
  return unavailableReason;
}

/** @internal Test helper */
export async function resetAppDbForTests(dbPath: string): Promise<void> {
  if (client) {
    client.close();
    client = null;
    schemaReady = null;
  }

  unavailableReason = null;
  process.env.APP_DATABASE_PATH = dbPath;
  delete process.env.TURSO_DATABASE_URL;
  delete process.env.TURSO_AUTH_TOKEN;
  delete process.env.VERCEL;

  if (existsSync(dbPath)) {
    unlinkSync(dbPath);
  }

  await getAppDb();
}

/** @internal Test helper */
export function closeAppDbForTests(): void {
  if (client) {
    client.close();
    client = null;
    schemaReady = null;
  }
  unavailableReason = null;
}
