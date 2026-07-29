import type { Keyboard, KeyboardToken } from "@/types";

export type DropCandidateStatus = "pending" | "approved" | "rejected";

export interface DropCandidate {
  id: string;
  brandId: string;
  name: string;
  sourceUrl: string;
  purchaseUrl: string | null;
  detectionSource: "scanner" | "manual";
  signals: string[];
  confidence: number;
  status: DropCandidateStatus;
  rawSnippet: string | null;
  detectedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export interface PublishedDrop {
  keyboardId: string;
  candidateId: string | null;
  keyboard: Keyboard;
  token: KeyboardToken;
  featuredOrder: number;
  featuredAt: string;
  approvedBy: string;
}

export interface ApproveDropInput {
  candidateId: string;
  approvedBy: string;
  keyboard?: Partial<Keyboard>;
  maxSupply?: number;
  rarityScore?: number;
  /** When true (default), unpublish featured drops that are out_of_stock or unknown. */
  replaceUnavailableFeatured?: boolean;
}

/** Featured drops with these stock statuses may be replaced by new limited editions. */
export const REPLACEABLE_FEATURED_STATUSES = [
  "out_of_stock",
  "unknown",
] as const;

export const DROP_TOKEN_DEFAULTS = {
  rarityScore: 99,
  maxSupply: 250,
};
