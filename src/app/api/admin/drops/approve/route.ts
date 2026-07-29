import { requireAdminAuthorization } from "@/lib/admin";
import { approveDropCandidate } from "@/lib/drops/approve";
import { refreshAvailability } from "@/lib/availability/checker";
import { jsonResponse } from "@/lib/security/api";
import { readJsonBody } from "@/lib/security/request";

export const dynamic = "force-dynamic";

interface ApproveBody {
  candidateId: string;
  maxSupply?: number;
  rarityScore?: number;
  keyboard?: {
    name?: string;
    priceUsd?: number;
    tagline?: string;
    purchaseUrl?: string;
    badge?: string;
  };
}

export async function POST(request: Request) {
  const unauthorized = requireAdminAuthorization(request);
  if (unauthorized) {
    return unauthorized;
  }

  const parsed = await readJsonBody(request);
  if (!parsed.ok) {
    return jsonResponse({ error: parsed.error }, { status: 400 });
  }

  const body = parsed.data as ApproveBody;

  if (!body.candidateId) {
    return jsonResponse({ error: "candidateId is required." }, { status: 400 });
  }

  const result = await approveDropCandidate({
    candidateId: body.candidateId,
    approvedBy: "admin",
    maxSupply: body.maxSupply,
    rarityScore: body.rarityScore,
    keyboard: body.keyboard,
  });

  if (!result.ok) {
    return jsonResponse({ error: result.error }, { status: 400 });
  }

  try {
    await refreshAvailability({
      force: true,
      keyboardIds: [result.drop.keyboardId],
    });
  } catch {
    // Approval succeeded; stock refresh can retry via cron.
  }

  return jsonResponse({
    drop: result.drop,
    replacedKeyboardIds: result.replacedKeyboardIds,
  });
}
