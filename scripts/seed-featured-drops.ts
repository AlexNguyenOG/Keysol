/**
 * Seeds local SQLite with the featured limited drops currently published
 * on production (keysol.vercel.app), so localhost matches the live catalog.
 *
 * Usage: bun run scripts/seed-featured-drops.ts
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";

interface FeaturedDropPayload {
  keyboardId: string;
  keyboard: unknown;
  token: unknown;
  featuredAt: string;
}

async function main() {
  const response = await fetch("https://keysol.vercel.app/api/drops/featured");
  if (!response.ok) {
    throw new Error(`Failed to fetch production drops: ${response.status}`);
  }

  const body = (await response.json()) as { drops: FeaturedDropPayload[] };
  if (!body.drops?.length) {
    console.log("No featured drops on production.");
    return;
  }

  const dbPath = path.join(process.cwd(), "data", "app.db");
  mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = createClient({ url: `file:${dbPath}` });

  await db.executeMultiple(`
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

  let order = body.drops.length;
  for (const drop of body.drops) {
    const featuredAt = Date.parse(drop.featuredAt) || Date.now();
    await db.execute({
      sql: `
        INSERT INTO published_drops (
          keyboard_id, candidate_id, keyboard_json, token_json,
          featured_order, featured_at, approved_by
        ) VALUES (?, NULL, ?, ?, ?, ?, ?)
        ON CONFLICT(keyboard_id) DO UPDATE SET
          keyboard_json = excluded.keyboard_json,
          token_json = excluded.token_json,
          featured_order = excluded.featured_order,
          featured_at = excluded.featured_at,
          approved_by = excluded.approved_by
      `,
      args: [
        drop.keyboardId,
        JSON.stringify(drop.keyboard),
        JSON.stringify(drop.token),
        order,
        featuredAt,
        "local-seed-from-production",
      ],
    });
    console.log(`Published ${drop.keyboardId} (order ${order})`);
    order -= 1;
  }

  db.close();
  console.log(`Seeded ${body.drops.length} featured drops into ${dbPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
