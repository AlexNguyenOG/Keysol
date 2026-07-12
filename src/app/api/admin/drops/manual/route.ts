import { brands } from "@/data/brands";
import { requireAdminAuthorization } from "@/lib/admin";
import { createManualDropCandidate } from "@/lib/drops/approve";
import { jsonResponse } from "@/lib/security/api";
import { readJsonBody } from "@/lib/security/request";

export const dynamic = "force-dynamic";

interface ManualBody {
  brandId: string;
  name: string;
  sourceUrl: string;
  purchaseUrl?: string;
  signals?: string[];
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

  const body = parsed.data as ManualBody;

  if (!body.brandId || !body.name || !body.sourceUrl) {
    return jsonResponse(
      { error: "brandId, name, and sourceUrl are required." },
      { status: 400 },
    );
  }

  if (!brands.some((brand) => brand.id === body.brandId)) {
    return jsonResponse({ error: "Unknown brandId." }, { status: 400 });
  }

  const candidate = await createManualDropCandidate(body);
  if ("ok" in candidate && candidate.ok === false) {
    return jsonResponse({ error: candidate.error }, { status: 400 });
  }

  return jsonResponse({ candidate });
}
