import { NextResponse } from "next/server";
import { getAvailability } from "@/lib/availability/checker";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const refresh = searchParams.get("refresh") === "1";

  const availability = await getAvailability({ refresh });

  return NextResponse.json({
    availability,
    refreshedAt: new Date().toISOString(),
  });
}
