import { getFeaturedDrops } from "@/lib/catalog.server";
import { jsonResponse } from "@/lib/security/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const drops = await getFeaturedDrops();

  return jsonResponse({
    drops: drops.map((drop) => ({
      keyboardId: drop.keyboardId,
      keyboard: drop.keyboard,
      token: drop.token,
      featuredAt: drop.featuredAt,
    })),
  });
}
