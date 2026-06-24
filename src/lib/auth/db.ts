import { existsSync, mkdirSync, readFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "auth.db");
const LEGACY_JSON_PATH = path.join(process.cwd(), "data", "users.json");

let database: Database.Database | null = null;

function getDatabasePath(): string {
  return process.env.AUTH_DATABASE_PATH ?? DEFAULT_DB_PATH;
}

function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      email_verified INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

    CREATE TABLE IF NOT EXISTS rate_limits (
      bucket_key TEXT PRIMARY KEY,
      count INTEGER NOT NULL,
      reset_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS auth_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      token_type TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON auth_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires_at ON auth_tokens(expires_at);

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

  migrateSchema(db);
}

function migrateSchema(db: Database.Database): void {
  const columns = db
    .prepare("PRAGMA table_info(users)")
    .all() as Array<{ name: string }>;

  if (!columns.some((column) => column.name === "email_verified")) {
    db.exec(
      "ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0",
    );
  }
}

function migrateFromLegacyJson(db: Database.Database): void {
  if (!existsSync(LEGACY_JSON_PATH)) {
    return;
  }

  const existingUsers = db
    .prepare("SELECT COUNT(*) AS count FROM users")
    .get() as { count: number };
  if (existingUsers.count > 0) {
    return;
  }

  try {
    const raw = readFileSync(LEGACY_JSON_PATH, "utf8");
    const parsed = JSON.parse(raw) as {
      users?: Array<{
        id: string;
        email: string;
        name: string;
        passwordHash: string;
        createdAt: string;
      }>;
    };

    if (!parsed.users?.length) {
      return;
    }

    const insert = db.prepare(`
      INSERT INTO users (id, email, name, password_hash, created_at, email_verified)
      VALUES (@id, @email, @name, @password_hash, @created_at, 0)
    `);

    const migrate = db.transaction((users) => {
      for (const user of users) {
        insert.run({
          id: user.id,
          email: user.email,
          name: user.name,
          password_hash: user.passwordHash,
          created_at: user.createdAt,
        });
      }
    });

    migrate(parsed.users);
  } catch {
    // Ignore invalid legacy files.
  }
}

export function getAuthDb(): Database.Database {
  if (!database) {
    const dbPath = getDatabasePath();
    mkdirSync(path.dirname(dbPath), { recursive: true });
    database = new Database(dbPath);
    database.pragma("journal_mode = WAL");
    database.pragma("foreign_keys = ON");
    initializeSchema(database);
    migrateFromLegacyJson(database);
  }

  return database;
}

/** @internal Test helper */
export function resetAuthDbForTests(dbPath: string): void {
  if (database) {
    database.close();
    database = null;
  }

  process.env.AUTH_DATABASE_PATH = dbPath;
  if (existsSync(dbPath)) {
    unlinkSync(dbPath);
  }

  getAuthDb();
}

/** @internal Test helper */
export function closeAuthDbForTests(): void {
  if (database) {
    database.close();
    database = null;
  }
}
