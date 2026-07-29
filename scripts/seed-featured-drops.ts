/**
 * Seeds local SQLite with the featured limited drops currently published
 * on production (keysol.vercel.app), so localhost matches the live catalog.
 *
 * By default, replaces existing featured drops that are out_of_stock or
 * unknown (keeps in_stock / limited). Pass --keep-unavailable to skip that.
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

interface AvailabilityRecord {
  status?: string;
}

async function main() {
  const keepUnavailable = process.argv.includes("--keep-unavailable");
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

  if (!keepUnavailable) {
    let availability: Record<string, AvailabilityRecord> = {};
    try {
      const base =
        process.env.KEYSOL_BASE_URL?.replace(/\/$/, "") ||
        "http://127.0.0.1:3002";
      const availRes = await fetch(`${base}/api/availability`);
      if (availRes.ok) {
        const availBody = (await availRes.json()) as {
          availability?: Record<string, AvailabilityRecord>;
        };
        availability = availBody.availability ?? {};
      }
    } catch {
      // Local server may be down; fall back to keeping existing rows.
    }

    const existing = await db.execute("SELECT keyboard_id FROM published_drops");
    for (const row of existing.rows) {
      const keyboardId = String(row.keyboard_id);
      const status = availability[keyboardId]?.status ?? "unknown";
      if (status === "out_of_stock" || status === "unknown") {
        await db.execute({
          sql: "DELETE FROM published_drops WHERE keyboard_id = ?",
          args: [keyboardId],
        });
        console.log(
          `Replaced unavailable featured drop: ${keyboardId} (${status})`,
        );
      }
    }
  }

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
