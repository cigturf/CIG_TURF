import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase/admin";

/**
 * Authorization: check admin access by Supabase user_id only.
 */
export async function isAdminUser(userId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("admins")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error) return Boolean(data);
    console.error("[Admin] Supabase lookup failed:", error.message);
  }

  try {
    const admin = await prisma.admin.findUnique({
      where: { userId },
      select: { id: true },
    });

    return Boolean(admin);
  } catch (error) {
    console.error("[Admin] Prisma lookup failed:", error);
    return false;
  }
}
