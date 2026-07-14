import { randomUUID } from "node:crypto";
import { getAppDb, getAppDbUnavailableReason } from "@/lib/db/app";
import type {
  DropCandidate,
  DropCandidateStatus,
  PublishedDrop,
} from "@/lib/drops/types";
import type { Keyboard, KeyboardToken } from "@/types";

function requireDb() {
  return getAppDb().then((db) => {
    if (!db) {
      throw new Error(
        getAppDbUnavailableReason() ??
          "App database is not configured.",
      );
    }
    return db;
  });
}

interface DropCandidateRow {
  id: string;
  brand_id: string;
  name: string;
  source_url: string;
  purchase_url: string | null;
  detection_source: "scanner" | "manual";
  signals: string;
  confidence: number;
  status: DropCandidateStatus;
  raw_snippet: string | null;
  detected_at: number;
  reviewed_at: number | null;
  reviewed_by: string | null;
}

interface PublishedDropRow {
  keyboard_id: string;
  candidate_id: string | null;
  keyboard_json: string;
  token_json: string;
  featured_order: number;
  featured_at: number;
  approved_by: string;
}

function mapCandidate(row: DropCandidateRow): DropCandidate {
  return {
    id: row.id,
    brandId: row.brand_id,
    name: row.name,
    sourceUrl: row.source_url,
    purchaseUrl: row.purchase_url,
    detectionSource: row.detection_source,
    signals: JSON.parse(row.signals) as string[],
    confidence: row.confidence,
    status: row.status,
    rawSnippet: row.raw_snippet,
    detectedAt: new Date(row.detected_at).toISOString(),
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : null,
    reviewedBy: row.reviewed_by,
  };
}

function mapPublished(row: PublishedDropRow): PublishedDrop {
  return {
    keyboardId: row.keyboard_id,
    candidateId: row.candidate_id,
    keyboard: JSON.parse(row.keyboard_json) as Keyboard,
    token: JSON.parse(row.token_json) as KeyboardToken,
    featuredOrder: row.featured_order,
    featuredAt: new Date(row.featured_at).toISOString(),
    approvedBy: row.approved_by,
  };
}

function asRows<T>(rows: unknown[]): T[] {
  return rows as T[];
}

export async function upsertDropCandidate(input: {
  brandId: string;
  name: string;
  sourceUrl: string;
  purchaseUrl?: string | null;
  detectionSource: "scanner" | "manual";
  signals: string[];
  confidence: number;
  rawSnippet?: string | null;
}): Promise<DropCandidate> {
  const db = await requireDb();
  const existing = await db.execute({
    sql: "SELECT id FROM drop_candidates WHERE source_url = ?",
    args: [input.sourceUrl],
  });

  const now = Date.now();
  const signalsJson = JSON.stringify(input.signals);
  const purchaseUrl = input.purchaseUrl ?? null;
  const rawSnippet = input.rawSnippet ?? null;

  if (existing.rows.length > 0) {
    await db.execute({
      sql: `
        UPDATE drop_candidates
        SET
          brand_id = ?,
          name = ?,
          purchase_url = ?,
          detection_source = ?,
          signals = ?,
          confidence = ?,
          raw_snippet = ?,
          detected_at = ?,
          status = CASE WHEN status = 'approved' THEN status ELSE 'pending' END
        WHERE source_url = ?
      `,
      args: [
        input.brandId,
        input.name,
        purchaseUrl,
        input.detectionSource,
        signalsJson,
        input.confidence,
        rawSnippet,
        now,
        input.sourceUrl,
      ],
    });

    const row = await db.execute({
      sql: "SELECT * FROM drop_candidates WHERE source_url = ?",
      args: [input.sourceUrl],
    });

    return mapCandidate(row.rows[0] as unknown as DropCandidateRow);
  }

  const id = randomUUID();
  await db.execute({
    sql: `
      INSERT INTO drop_candidates (
        id, brand_id, name, source_url, purchase_url, detection_source,
        signals, confidence, status, raw_snippet, detected_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `,
    args: [
      id,
      input.brandId,
      input.name,
      input.sourceUrl,
      purchaseUrl,
      input.detectionSource,
      signalsJson,
      input.confidence,
      rawSnippet,
      now,
    ],
  });

  const row = await db.execute({
    sql: "SELECT * FROM drop_candidates WHERE id = ?",
    args: [id],
  });

  return mapCandidate(row.rows[0] as unknown as DropCandidateRow);
}

export async function listDropCandidates(
  status?: DropCandidateStatus,
): Promise<DropCandidate[]> {
  const db = await getAppDb();
  if (!db) {
    return [];
  }

  const result = status
    ? await db.execute({
        sql: "SELECT * FROM drop_candidates WHERE status = ? ORDER BY detected_at DESC",
        args: [status],
      })
    : await db.execute(
        "SELECT * FROM drop_candidates ORDER BY detected_at DESC",
      );

  return asRows<DropCandidateRow>(result.rows as unknown as DropCandidateRow[]).map(
    mapCandidate,
  );
}

export async function getDropCandidate(
  id: string,
): Promise<DropCandidate | undefined> {
  const db = await getAppDb();
  if (!db) {
    return undefined;
  }

  const result = await db.execute({
    sql: "SELECT * FROM drop_candidates WHERE id = ?",
    args: [id],
  });

  const row = result.rows[0] as unknown as DropCandidateRow | undefined;
  return row ? mapCandidate(row) : undefined;
}

export async function setDropCandidateStatus(
  id: string,
  status: DropCandidateStatus,
  reviewedBy: string,
): Promise<DropCandidate | undefined> {
  const db = await requireDb();
  const now = Date.now();
  await db.execute({
    sql: `
      UPDATE drop_candidates
      SET status = ?, reviewed_at = ?, reviewed_by = ?
      WHERE id = ?
    `,
    args: [status, now, reviewedBy, id],
  });

  return getDropCandidate(id);
}

export async function publishDrop(input: {
  keyboard: Keyboard;
  token: KeyboardToken;
  candidateId: string | null;
  approvedBy: string;
  featuredOrder?: number;
}): Promise<PublishedDrop> {
  const db = await requireDb();
  const now = Date.now();

  let featuredOrder = input.featuredOrder;
  if (featuredOrder === undefined) {
    const next = await db.execute(
      "SELECT COALESCE(MAX(featured_order), 0) + 1 AS next FROM published_drops",
    );
    featuredOrder = Number(next.rows[0]?.next ?? 1);
  }

  await db.execute({
    sql: `
      INSERT INTO published_drops (
        keyboard_id, candidate_id, keyboard_json, token_json,
        featured_order, featured_at, approved_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(keyboard_id) DO UPDATE SET
        candidate_id = excluded.candidate_id,
        keyboard_json = excluded.keyboard_json,
        token_json = excluded.token_json,
        featured_order = excluded.featured_order,
        featured_at = excluded.featured_at,
        approved_by = excluded.approved_by
    `,
    args: [
      input.keyboard.id,
      input.candidateId,
      JSON.stringify(input.keyboard),
      JSON.stringify(input.token),
      featuredOrder,
      now,
      input.approvedBy,
    ],
  });

  const row = await db.execute({
    sql: "SELECT * FROM published_drops WHERE keyboard_id = ?",
    args: [input.keyboard.id],
  });

  return mapPublished(row.rows[0] as unknown as PublishedDropRow);
}

export async function listPublishedDrops(): Promise<PublishedDrop[]> {
  const db = await getAppDb();
  if (!db) {
    return [];
  }

  const result = await db.execute(
    "SELECT * FROM published_drops ORDER BY featured_order DESC, featured_at DESC",
  );

  return asRows<PublishedDropRow>(
    result.rows as unknown as PublishedDropRow[],
  ).map(mapPublished);
}

/** Patch keyboard image on an already-published drop without changing order. */
export async function updatePublishedDropImage(
  keyboardId: string,
  image: string,
): Promise<PublishedDrop | undefined> {
  const db = await getAppDb();
  if (!db) {
    return undefined;
  }

  const existing = await db.execute({
    sql: "SELECT * FROM published_drops WHERE keyboard_id = ?",
    args: [keyboardId],
  });
  const row = existing.rows[0] as unknown as PublishedDropRow | undefined;
  if (!row) {
    return undefined;
  }

  const keyboard = {
    ...(JSON.parse(row.keyboard_json) as Keyboard),
    image,
  };

  await db.execute({
    sql: `
      UPDATE published_drops
      SET keyboard_json = ?
      WHERE keyboard_id = ?
    `,
    args: [JSON.stringify(keyboard), keyboardId],
  });

  return mapPublished({
    ...row,
    keyboard_json: JSON.stringify(keyboard),
  });
}

/** @internal Test helper */
export async function resetDropsForTests(): Promise<void> {
  const db = await requireDb();
  await db.execute("DELETE FROM published_drops");
  await db.execute("DELETE FROM drop_candidates");
}
