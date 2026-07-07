import { NextResponse } from "next/server";

import {
  createPricingRule,
  deactivatePricingRule,
  listAllPricingRules,
  upsertDefaultPricingRule,
} from "@/features/pricing/services/pricing.repository";
import { validatePricingRule } from "@/features/pricing/services/pricing-engine.service";
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
      type: "default" | "range";
      price: number;
      startMinute?: number | null;
      endMinute?: number | null;
      dateStart?: string | null;
      dateEnd?: string | null;
      weekdays?: number[] | null;
      priority?: number;
    };

    const validation = validatePricingRule(body);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const rule =
      body.type === "default"
        ? await upsertDefaultPricingRule(body.price, auth.session.user.id)
        : await createPricingRule({
            ...body,
            createdBy: auth.session.user.id,
            weekdays: body.weekdays ?? [],
            priority: body.priority ?? 0,
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

