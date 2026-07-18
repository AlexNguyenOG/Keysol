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
}

export const DROP_TOKEN_DEFAULTS = {
  rarityScore: 99,
  maxSupply: 250,
};
