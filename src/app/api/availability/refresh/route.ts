import { refreshAvailability } from "@/lib/availability/checker";
import { jsonResponse } from "@/lib/security/api";
import { isCronAuthorized } from "@/lib/security/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function handleRefresh(request: Request) {
  if (!isCronAuthorized(request)) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  const availability = await refreshAvailability({ force: true });

  return jsonResponse({
    availability,
    refreshedAt: new Date().toISOString(),
  });
}

/** Vercel Cron invokes this path with GET. */
export async function GET(request: Request) {
  return handleRefresh(request);
}

export async function POST(request: Request) {
  return handleRefresh(request);
}
