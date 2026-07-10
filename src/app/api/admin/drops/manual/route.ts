import { brands } from "@/data/brands";
import { requireAdminAuthorization } from "@/lib/admin";
import { createManualDropCandidate } from "@/lib/drops/approve";
import { jsonResponse } from "@/lib/security/api";

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

  let body: ManualBody;
  try {
    body = (await request.json()) as ManualBody;
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.brandId || !body.name || !body.sourceUrl) {
    return jsonResponse(
      { error: "brandId, name, and sourceUrl are required." },
      { status: 400 },
    );
  }

  if (!brands.some((brand) => brand.id === body.brandId)) {
    return jsonResponse({ error: "Unknown brandId." }, { status: 400 });
  }

  if (!body.sourceUrl.startsWith("https://")) {
    return jsonResponse(
      { error: "sourceUrl must be a valid HTTPS URL." },
      { status: 400 },
    );
  }

  const candidate = await createManualDropCandidate(body);

  return jsonResponse({ candidate });
}
