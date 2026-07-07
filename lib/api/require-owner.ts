import { NextResponse } from "next/server";

import { getAdminContext } from "@/features/admin/services/admin-context.service";
import { getSession } from "@/server/auth/session";

export async function requireOwnerSession() {
  const session = await getSession();

  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const admin = await getAdminContext(session.user.id);
  if (!admin) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  if (admin.role !== "owner") {
    return {
      error: NextResponse.json(
        { error: "Only the business owner can manage promotions and website content" },
        { status: 403 },
      ),
    };
  }

  return { session, admin };
}
