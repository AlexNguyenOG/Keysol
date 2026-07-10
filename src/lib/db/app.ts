import { existsSync, mkdirSync, unlinkSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "app.db");

let database: Database.Database | null = null;

function getDatabasePath(): string {
  return process.env.APP_DATABASE_PATH ?? DEFAULT_DB_PATH;
}

function initializeSchema(db: Database.Database): void {
  db.exec(`
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

export function getAppDb(): Database.Database {
  if (!database) {
    const dbPath = getDatabasePath();
    mkdirSync(path.dirname(dbPath), { recursive: true });
    database = new Database(dbPath);
    database.pragma("journal_mode = WAL");
    database.pragma("foreign_keys = ON");
    initializeSchema(database);
  }

  return database;
}

/** @internal Test helper */
export function resetAppDbForTests(dbPath: string): void {
  if (database) {
    database.close();
    database = null;
  }

  process.env.APP_DATABASE_PATH = dbPath;
  if (existsSync(dbPath)) {
    unlinkSync(dbPath);
  }

  getAppDb();
}

/** @internal Test helper */
export function closeAppDbForTests(): void {
  if (database) {
    database.close();
    database = null;
  }
}
