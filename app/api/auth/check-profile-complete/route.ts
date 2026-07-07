import { NextResponse } from "next/server";

import { checkProfileCompleteAction } from "@/features/auth/actions/auth.actions";
import { parseJsonBody } from "@/lib/api/parse-request";
import { authUserIdBodySchema } from "@/lib/validations/request";
import { apiErrorResponse } from "@/lib/security/safe-error";
import { getSession } from "@/server/auth/session";

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, authUserIdBodySchema);
  if (!parsed.success) return parsed.response;

  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.id !== parsed.data.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const profileComplete = await checkProfileCompleteAction(parsed.data.userId);
    return NextResponse.json({ profileComplete });
  } catch {
    return apiErrorResponse("Unable to check profile", 500, "auth/check-profile-complete");
  }
}
