import { requireAdminSession } from "@/lib/admin";
import { listDropCandidates } from "@/lib/drops/store";
import { jsonResponse } from "@/lib/security/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (session instanceof Response) {
    return session;
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as
    | "pending"
    | "approved"
    | "rejected"
    | null;

  const candidates = listDropCandidates(status ?? undefined);

  return jsonResponse({ candidates });
}
