import { brands } from "@/data/brands";
import {
  getDropCandidate,
  publishDrop,
  setDropCandidateStatus,
  upsertDropCandidate,
} from "@/lib/drops/store";
import {
  DROP_TOKEN_DEFAULTS,
  type ApproveDropInput,
} from "@/lib/drops/types";
import type { Keyboard, KeyboardToken } from "@/types";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function buildKeyboardId(name: string, brandId: string): string {
  return `${brandId}-${slugify(name)}`.replace(/--+/g, "-");
}

function buildTokenSymbol(name: string): string {
  const parts = name
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((part) => part.slice(0, 3).toUpperCase());

  return `KSOL-${parts.join("") || "DROP"}`.slice(0, 12);
}

export function approveDropCandidate(input: ApproveDropInput): {
  ok: true;
  drop: ReturnType<typeof publishDrop>;
} | { ok: false; error: string } {
  const candidate = getDropCandidate(input.candidateId);
  if (!candidate) {
    return { ok: false, error: "Drop candidate not found." };
  }

  if (candidate.status === "approved") {
    return { ok: false, error: "This candidate is already approved." };
  }

  if (!brands.some((brand) => brand.id === candidate.brandId)) {
    return { ok: false, error: "Unknown brand on candidate." };
  }

  const keyboardId =
    input.keyboard?.id ?? buildKeyboardId(candidate.name, candidate.brandId);
  const purchaseUrl =
    input.keyboard?.purchaseUrl ??
    candidate.purchaseUrl ??
    candidate.sourceUrl;

  if (!purchaseUrl.startsWith("https://")) {
    return { ok: false, error: "A valid HTTPS purchase URL is required." };
  }

  const keyboard: Keyboard = {
    id: keyboardId,
    brandId: candidate.brandId,
    name: input.keyboard?.name ?? candidate.name,
    releaseDate: input.keyboard?.releaseDate ?? new Date().toISOString().slice(0, 10),
    priceUsd: input.keyboard?.priceUsd ?? 199,
    tagline:
      input.keyboard?.tagline ??
      `Limited drop detected with ${candidate.signals.join(", ")}.`,
    badge: input.keyboard?.badge ?? "Limited Drop",
    image: input.keyboard?.image ?? "/keyboards/drop-placeholder.svg",
    purchaseUrl,
    stats: input.keyboard?.stats ?? {
      switchType: "Limited edition / special run",
      layout: "TKL",
      connectivity: ["USB-C wired"],
      actuationPointMm: 0.1,
      keyTravelMm: 3.5,
      pollingRateHz: 8000,
      responseTimeMs: 0.125,
      rapidTrigger: true,
    },
  };

  const maxSupply = input.maxSupply ?? DROP_TOKEN_DEFAULTS.maxSupply;
  const rarityScore = input.rarityScore ?? DROP_TOKEN_DEFAULTS.rarityScore;

  const token: KeyboardToken = {
    id: `keysol-drop-${slugify(keyboard.id)}`.slice(0, 40),
    keyboardId: keyboard.id,
    symbol: buildTokenSymbol(keyboard.name),
    name: `KeySol ${keyboard.name} Drop Token`,
    rarityTier: DROP_TOKEN_DEFAULTS.rarityTier,
    rarityScore,
    maxSupply,
    rationale: `Admin-approved limited drop (${candidate.signals.join(", ")}). Low max supply reflects batch scarcity.`,
  };

  const published = publishDrop({
    keyboard,
    token,
    candidateId: candidate.id,
    approvedBy: input.approvedBy,
  });

  setDropCandidateStatus(candidate.id, "approved", input.approvedBy);

  return { ok: true, drop: published };
}

export function rejectDropCandidate(
  candidateId: string,
  reviewedBy: string,
): { ok: true } | { ok: false; error: string } {
  const candidate = getDropCandidate(candidateId);
  if (!candidate) {
    return { ok: false, error: "Drop candidate not found." };
  }

  setDropCandidateStatus(candidateId, "rejected", reviewedBy);
  return { ok: true };
}

export function createManualDropCandidate(input: {
  brandId: string;
  name: string;
  sourceUrl: string;
  purchaseUrl?: string;
  signals?: string[];
}): ReturnType<typeof upsertDropCandidate> {
  return upsertDropCandidate({
    brandId: input.brandId,
    name: input.name,
    sourceUrl: input.sourceUrl,
    purchaseUrl: input.purchaseUrl ?? input.sourceUrl,
    detectionSource: "manual",
    signals: input.signals ?? ["manual submission"],
    confidence: 1,
    rawSnippet: "Submitted manually for admin review.",
  });
}
