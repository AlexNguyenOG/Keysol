import { randomUUID } from "node:crypto";
import { getAuthDb } from "@/lib/auth/db";
import type {
  DropCandidate,
  DropCandidateStatus,
  PublishedDrop,
} from "@/lib/drops/types";
import type { Keyboard, KeyboardToken } from "@/types";

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

export function upsertDropCandidate(input: {
  brandId: string;
  name: string;
  sourceUrl: string;
  purchaseUrl?: string | null;
  detectionSource: "scanner" | "manual";
  signals: string[];
  confidence: number;
  rawSnippet?: string | null;
}): DropCandidate {
  const db = getAuthDb();
  const existing = db
    .prepare("SELECT id FROM drop_candidates WHERE source_url = ?")
    .get(input.sourceUrl) as { id: string } | undefined;

  const now = Date.now();
  const signalsJson = JSON.stringify(input.signals);

  if (existing) {
    db.prepare(
      `
      UPDATE drop_candidates
      SET
        brand_id = @brandId,
        name = @name,
        purchase_url = @purchaseUrl,
        detection_source = @detectionSource,
        signals = @signals,
        confidence = @confidence,
        raw_snippet = @rawSnippet,
        detected_at = @detectedAt,
        status = CASE WHEN status = 'approved' THEN status ELSE 'pending' END
      WHERE source_url = @sourceUrl
    `,
    ).run({
      brandId: input.brandId,
      name: input.name,
      purchaseUrl: input.purchaseUrl ?? null,
      detectionSource: input.detectionSource,
      signals: signalsJson,
      confidence: input.confidence,
      rawSnippet: input.rawSnippet ?? null,
      detectedAt: now,
      sourceUrl: input.sourceUrl,
    });

    const row = db
      .prepare("SELECT * FROM drop_candidates WHERE source_url = ?")
      .get(input.sourceUrl) as DropCandidateRow;

    return mapCandidate(row);
  }

  const id = randomUUID();
  db.prepare(
    `
    INSERT INTO drop_candidates (
      id, brand_id, name, source_url, purchase_url, detection_source,
      signals, confidence, status, raw_snippet, detected_at
    ) VALUES (
      @id, @brandId, @name, @sourceUrl, @purchaseUrl, @detectionSource,
      @signals, @confidence, 'pending', @rawSnippet, @detectedAt
    )
  `,
  ).run({
    id,
    brandId: input.brandId,
    name: input.name,
    sourceUrl: input.sourceUrl,
    purchaseUrl: input.purchaseUrl ?? null,
    detectionSource: input.detectionSource,
    signals: signalsJson,
    confidence: input.confidence,
    rawSnippet: input.rawSnippet ?? null,
    detectedAt: now,
  });

  const row = db
    .prepare("SELECT * FROM drop_candidates WHERE id = ?")
    .get(id) as DropCandidateRow;

  return mapCandidate(row);
}

export function listDropCandidates(
  status?: DropCandidateStatus,
): DropCandidate[] {
  const db = getAuthDb();
  const rows = status
    ? (db
        .prepare(
          "SELECT * FROM drop_candidates WHERE status = ? ORDER BY detected_at DESC",
        )
        .all(status) as DropCandidateRow[])
    : (db
        .prepare("SELECT * FROM drop_candidates ORDER BY detected_at DESC")
        .all() as DropCandidateRow[]);

  return rows.map(mapCandidate);
}

export function getDropCandidate(id: string): DropCandidate | undefined {
  const row = getAuthDb()
    .prepare("SELECT * FROM drop_candidates WHERE id = ?")
    .get(id) as DropCandidateRow | undefined;

  return row ? mapCandidate(row) : undefined;
}

export function setDropCandidateStatus(
  id: string,
  status: DropCandidateStatus,
  reviewedBy: string,
): DropCandidate | undefined {
  const now = Date.now();
  getAuthDb()
    .prepare(
      `
      UPDATE drop_candidates
      SET status = ?, reviewed_at = ?, reviewed_by = ?
      WHERE id = ?
    `,
    )
    .run(status, now, reviewedBy, id);

  return getDropCandidate(id);
}

export function publishDrop(input: {
  keyboard: Keyboard;
  token: KeyboardToken;
  candidateId: string | null;
  approvedBy: string;
  featuredOrder?: number;
}): PublishedDrop {
  const db = getAuthDb();
  const now = Date.now();
  const featuredOrder =
    input.featuredOrder ??
    ((db
      .prepare("SELECT COALESCE(MAX(featured_order), 0) + 1 AS next FROM published_drops")
      .get() as { next: number }).next ?? 1);

  db.prepare(
    `
    INSERT INTO published_drops (
      keyboard_id, candidate_id, keyboard_json, token_json,
      featured_order, featured_at, approved_by
    ) VALUES (
      @keyboardId, @candidateId, @keyboardJson, @tokenJson,
      @featuredOrder, @featuredAt, @approvedBy
    )
    ON CONFLICT(keyboard_id) DO UPDATE SET
      candidate_id = excluded.candidate_id,
      keyboard_json = excluded.keyboard_json,
      token_json = excluded.token_json,
      featured_order = excluded.featured_order,
      featured_at = excluded.featured_at,
      approved_by = excluded.approved_by
  `,
  ).run({
    keyboardId: input.keyboard.id,
    candidateId: input.candidateId,
    keyboardJson: JSON.stringify(input.keyboard),
    tokenJson: JSON.stringify(input.token),
    featuredOrder,
    featuredAt: now,
    approvedBy: input.approvedBy,
  });

  const row = db
    .prepare("SELECT * FROM published_drops WHERE keyboard_id = ?")
    .get(input.keyboard.id) as PublishedDropRow;

  return mapPublished(row);
}

export function listPublishedDrops(): PublishedDrop[] {
  const rows = getAuthDb()
    .prepare(
      "SELECT * FROM published_drops ORDER BY featured_order DESC, featured_at DESC",
    )
    .all() as PublishedDropRow[];

  return rows.map(mapPublished);
}

/** @internal Test helper */
export function resetDropsForTests(): void {
  const db = getAuthDb();
  db.prepare("DELETE FROM published_drops").run();
  db.prepare("DELETE FROM drop_candidates").run();
}
