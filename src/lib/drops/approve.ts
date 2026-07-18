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
  type DropCandidate,
  type PublishedDrop,
} from "@/lib/drops/types";
import { resolveProductImageUrl } from "@/lib/drops/product-image";
import { assertPublicHttpUrl } from "@/lib/security/url";
import type { Keyboard, KeyboardToken } from "@/types";

const DROP_IMAGE_PLACEHOLDER = "/keyboards/drop-placeholder.svg";

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

export async function approveDropCandidate(input: ApproveDropInput): Promise<
  | {
      ok: true;
      drop: PublishedDrop;
    }
  | { ok: false; error: string }
> {
  const candidate = await getDropCandidate(input.candidateId);
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

  if (!(await assertPublicHttpUrl(purchaseUrl, { httpsOnly: true }))) {
    return {
      ok: false,
      error: "A valid public HTTPS purchase URL is required.",
    };
  }

  let image = input.keyboard?.image ?? DROP_IMAGE_PLACEHOLDER;
  if (!input.keyboard?.image) {
    const resolved = await resolveProductImageUrl(purchaseUrl);
    if (resolved) {
      image = resolved;
    }
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
    image,
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
    rarityScore,
    maxSupply,
    rationale: `Admin-approved limited drop (${candidate.signals.join(", ")}). Low max supply reflects batch scarcity.`,
  };

  const published = await publishDrop({
    keyboard,
    token,
    candidateId: candidate.id,
    approvedBy: input.approvedBy,
  });

  await setDropCandidateStatus(candidate.id, "approved", input.approvedBy);

  return { ok: true, drop: published };
}

export async function rejectDropCandidate(
  candidateId: string,
  reviewedBy: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const candidate = await getDropCandidate(candidateId);
  if (!candidate) {
    return { ok: false, error: "Drop candidate not found." };
  }

  await setDropCandidateStatus(candidateId, "rejected", reviewedBy);
  return { ok: true };
}

export async function createManualDropCandidate(input: {
  brandId: string;
  name: string;
  sourceUrl: string;
  purchaseUrl?: string;
  signals?: string[];
}): Promise<DropCandidate | { ok: false; error: string }> {
  if (!(await assertPublicHttpUrl(input.sourceUrl, { httpsOnly: true }))) {
    return { ok: false, error: "sourceUrl must be a valid public HTTPS URL." };
  }

  const purchaseUrl = input.purchaseUrl ?? input.sourceUrl;
  if (!(await assertPublicHttpUrl(purchaseUrl, { httpsOnly: true }))) {
    return { ok: false, error: "purchaseUrl must be a valid public HTTPS URL." };
  }

  return upsertDropCandidate({
    brandId: input.brandId,
    name: input.name,
    sourceUrl: input.sourceUrl,
    purchaseUrl,
    detectionSource: "manual",
    signals: input.signals ?? ["manual submission"],
    confidence: 1,
    rawSnippet: "Submitted manually for admin review.",
  });
}
