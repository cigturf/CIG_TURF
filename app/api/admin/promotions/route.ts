import { NextResponse } from "next/server";

import type { PromotionInput, PromotionListQuery } from "@/features/promotions/types";
import {
  archivePromotion,
  createPromotion,
  listPromotions,
  updatePromotion,
} from "@/features/promotions/services";
import { requireOwnerSession } from "@/lib/api/require-owner";

export async function GET(request: Request) {
  const auth = await requireOwnerSession();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const query: PromotionListQuery = {
    search: searchParams.get("search") ?? undefined,
    contentType: (searchParams.get("contentType") as PromotionListQuery["contentType"]) ?? undefined,
    status: (searchParams.get("status") as PromotionListQuery["status"]) ?? undefined,
    displayLocation:
      (searchParams.get("displayLocation") as PromotionListQuery["displayLocation"]) ?? undefined,
  };

  const promotions = await listPromotions(query);
  return NextResponse.json({ promotions });
}

export async function POST(request: Request) {
  const auth = await requireOwnerSession();
  if ("error" in auth) return auth.error;

  try {
    const body = (await request.json()) as { promotion: PromotionInput };
    const created = await createPromotion(body.promotion, auth.admin.userId);
    return NextResponse.json({ promotion: created });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create promotion" },
      { status: 400 },
    );
  }
}

export async function PUT(request: Request) {
  const auth = await requireOwnerSession();
  if ("error" in auth) return auth.error;

  try {
    const body = (await request.json()) as { id: string; promotion: Partial<PromotionInput> };
    const updated = await updatePromotion(body.id, body.promotion, auth.admin.userId);
    return NextResponse.json({ promotion: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update promotion" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireOwnerSession();
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const archived = await archivePromotion(id, auth.admin.userId);
    return NextResponse.json({ promotion: archived });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to archive promotion" },
      { status: 400 },
    );
  }
}
