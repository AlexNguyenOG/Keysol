import { refreshAvailability } from "@/lib/availability/checker";
import { jsonResponse } from "@/lib/security/api";
import { isCronAuthorized } from "@/lib/security/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isCronAuthorized(request)) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  const availability = await refreshAvailability({ force: true });

  return jsonResponse({
    availability,
    refreshedAt: new Date().toISOString(),
  });
}
