import { NextResponse } from "next/server";

import type { PromotionDisplayLocation } from "@/features/promotions/types";
import { getActiveAnnouncement, listPublicPromotions } from "@/features/promotions/services";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location") as PromotionDisplayLocation | null;
  const announcementOnly = searchParams.get("announcement") === "true";

  if (announcementOnly) {
    const announcement = await getActiveAnnouncement();
    return NextResponse.json({ announcement });
  }

  const promotions = await listPublicPromotions(location ?? undefined);
  return NextResponse.json({ promotions });
}
