import { NextResponse } from "next/server";

import {
  createOverrideRule,
  deactivatePricingRule,
  listAllPricingRules,
  upsertDefaultPricingRule,
} from "@/features/pricing/services/pricing.repository";
import { validateOverrideRule } from "@/features/pricing/services/pricing-engine.service";
import { requireAdminSession } from "@/lib/api/require-admin";

export async function GET() {
  const auth = await requireAdminSession("pricing.view");
  if ("error" in auth) return auth.error;

  const rules = await listAllPricingRules();
  return NextResponse.json({ rules });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession("pricing.manage");
  if ("error" in auth) return auth.error;

  try {
    const body = (await request.json()) as {
      type: "override";
      name: string;
      dateStart: string;
      dateEnd?: string | null;
      bands: { startMinute: number; endMinute: number; price: number }[];
    };

    if (body.type !== "override") {
      return NextResponse.json({ error: "Only override rules can be created via POST." }, { status: 400 });
    }

    const validation = validateOverrideRule({
      name: body.name,
      dateStart: body.dateStart,
      dateEnd: body.dateEnd ?? null,
      bands: body.bands,
    });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const rule = await createOverrideRule({
      name: body.name,
      dateStart: body.dateStart,
      dateEnd: body.dateEnd ?? null,
      bands: body.bands,
      createdBy: auth.session.user.id,
    });

    return NextResponse.json({ rule });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create pricing rule" },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdminSession("pricing.manage");
  if ("error" in auth) return auth.error;

  try {
    const body = (await request.json()) as { price: number };
    if (!body.price || body.price <= 0) {
      return NextResponse.json({ error: "Price must be greater than zero." }, { status: 400 });
    }

    const rule = await upsertDefaultPricingRule(body.price, auth.session.user.id);
    return NextResponse.json({ rule });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update default price" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdminSession("pricing.manage");
  if ("error" in auth) return auth.error;

  try {
    const body = (await request.json()) as { id: string };
    if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    await deactivatePricingRule(body.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to deactivate pricing rule" },
      { status: 400 },
    );
  }
}
