import { NextResponse, type NextRequest } from "next/server";

import { resolvePostAuthDestination } from "@/features/auth/services/post-auth-redirect.service";
import {
  clearAuthReturnToOnResponse,
  readAuthReturnToFromRequest,
} from "@/features/auth/utils/auth-return-to.server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = readAuthReturnToFromRequest(request, searchParams.get("next"));
  const destination = await resolvePostAuthDestination(next);

  return clearAuthReturnToOnResponse(
    NextResponse.redirect(`${origin}${destination}`),
  );
}
