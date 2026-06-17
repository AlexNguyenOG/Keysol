import { NextResponse } from "next/server";
import { refreshAvailability } from "@/lib/availability/checker";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.AVAILABILITY_CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const availability = await refreshAvailability({ force: true });

  return NextResponse.json({
    availability,
    refreshedAt: new Date().toISOString(),
  });
}
