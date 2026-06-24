import { scanForDropCandidates } from "@/lib/drops/detect";
import { jsonResponse } from "@/lib/security/api";
import { isCronAuthorized } from "@/lib/security/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function handleDetect(request: Request) {
  if (!isCronAuthorized(request)) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await scanForDropCandidates();

  return jsonResponse({
    scanned: result.scanned,
    candidates: result.createdOrUpdated.length,
    detectedAt: new Date().toISOString(),
  });
}

/** Vercel Cron invokes this path with GET. */
export async function GET(request: Request) {
  return handleDetect(request);
}

export async function POST(request: Request) {
  return handleDetect(request);
}
