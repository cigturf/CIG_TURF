import { NextResponse } from "next/server";

import { hasAdminPermission } from "@/features/admin/config/admin-permissions";
import { getAdminContext } from "@/features/admin/services/admin-context.service";
import type { AdminPermission } from "@/features/admin/types/admin.types";
import { getSession } from "@/server/auth/session";

export async function requireAdminSession(permission?: AdminPermission) {
  const session = await getSession();

  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const admin = await getAdminContext(session.user.id);
  if (!admin) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  if (permission && !hasAdminPermission(admin.role, permission)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { session, admin };
}
