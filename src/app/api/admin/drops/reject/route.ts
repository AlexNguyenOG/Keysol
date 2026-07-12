import { requireAdminAuthorization } from "@/lib/admin";
import { rejectDropCandidate } from "@/lib/drops/approve";
import { jsonResponse } from "@/lib/security/api";
import { readJsonBody } from "@/lib/security/request";

export const dynamic = "force-dynamic";

interface RejectBody {
  candidateId: string;
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

  const body = parsed.data as RejectBody;

  if (!body.candidateId) {
    return jsonResponse({ error: "candidateId is required." }, { status: 400 });
  }

  const result = await rejectDropCandidate(body.candidateId, "admin");
  if (!result.ok) {
    return jsonResponse({ error: result.error }, { status: 400 });
  }

  return jsonResponse({ ok: true });
}
