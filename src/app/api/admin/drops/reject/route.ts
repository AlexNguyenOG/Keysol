import { requireAdminSession } from "@/lib/admin";
import { rejectDropCandidate } from "@/lib/drops/approve";
import { jsonResponse } from "@/lib/security/api";

export const dynamic = "force-dynamic";

interface RejectBody {
  candidateId: string;
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (session instanceof Response) {
    return session;
  }

  let body: RejectBody;
  try {
    body = (await request.json()) as RejectBody;
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.candidateId) {
    return jsonResponse({ error: "candidateId is required." }, { status: 400 });
  }

  const result = rejectDropCandidate(body.candidateId, session.email);
  if (!result.ok) {
    return jsonResponse({ error: result.error }, { status: 400 });
  }

  return jsonResponse({ ok: true });
}
