import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/api/require-admin";
import { SettingsService } from "@/server/settings/settings.service";
import { parseBusinessSettings } from "@/features/business-settings/lib/parse";
import type { BusinessSettings } from "@/features/business-settings/types";

export async function GET() {
  const auth = await requireAdminSession("settings.view");
  if ("error" in auth) return auth.error;

  const settings = await SettingsService.getOrEmpty();
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  const auth = await requireAdminSession("settings.manage");
  if ("error" in auth) return auth.error;

  try {
    const body = (await request.json()) as { settings: BusinessSettings };
    const candidate = parseBusinessSettings(body.settings);
    if (!candidate) {
      return NextResponse.json({ error: "Invalid settings payload" }, { status: 400 });
    }
    const saved = await SettingsService.update(candidate);
    revalidatePath("/", "layout");
    revalidatePath("/book");
    return NextResponse.json({ settings: saved });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update settings" },
      { status: 400 },
    );
  }
}

