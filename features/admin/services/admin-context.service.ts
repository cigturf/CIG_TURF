import { getProfileById } from "@/features/auth/services";
import type {
  AdminBusinessBranding,
  AdminContext,
  AdminRole,
} from "@/features/admin/types/admin.types";
import { resolveBusinessName } from "@/features/business-settings/lib/parse";
import { SettingsService } from "@/server/settings";
import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getAppConfig } from "@/config/app.config";

type AdminRow = {
  id: string;
  user_id: string;
  role: AdminRole;
};

export async function getAdminRecordByUserId(userId: string): Promise<AdminRow | null> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("admins")
      .select("id, user_id, role")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data) {
      return data as AdminRow;
    }
  }

  try {
    const row = await prisma.admin.findUnique({
      where: { userId },
      select: { id: true, userId: true, role: true },
    });

    if (!row) return null;

    return {
      id: row.id,
      user_id: row.userId,
      role: row.role,
    };
  } catch {
    return null;
  }
}

export async function getAdminContext(
  userId: string,
  identity?: { email?: string; name?: string; image?: string | null },
): Promise<AdminContext | null> {
  const admin = await getAdminRecordByUserId(userId);
  if (!admin) return null;

  const profile = await getProfileById(userId);

  return {
    id: admin.id,
    userId: admin.user_id,
    role: admin.role,
    email: identity?.email ?? profile?.email ?? "",
    name:
      identity?.name ??
      profile?.name ??
      identity?.email?.split("@")[0] ??
      profile?.email?.split("@")[0] ??
      "Admin",
    image: identity?.image ?? null,
  };
}

export async function getAdminBusinessBranding(): Promise<AdminBusinessBranding> {
  const app = getAppConfig();
  const settings = await SettingsService.getPublic();

  return {
    businessName: resolveBusinessName(settings, app.envDisplayName),
    shortName: settings?.branding.shortName ?? app.envDisplayName,
    logoUrl: settings?.branding.logoUrl ?? null,
  };
}
