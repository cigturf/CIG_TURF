import { NextResponse } from "next/server";

import { updateCustomerNotes } from "@/features/admin/customers/services/customer.service";
import { requireOwnerSession } from "@/lib/api/require-owner";

type RouteContext = {
  params: Promise<{ key: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requireOwnerSession();
  if ("error" in auth) return auth.error;

  const { key } = await context.params;

  try {
    const body = (await request.json()) as { notes?: string | null };
    const notes = await updateCustomerNotes(
      decodeURIComponent(key),
      body.notes ?? null,
      auth.admin.userId,
    );
    return NextResponse.json({ customerKey: decodeURIComponent(key), notes });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save notes" },
      { status: 400 },
    );
  }
}
