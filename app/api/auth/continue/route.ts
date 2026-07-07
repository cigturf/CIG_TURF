import { NextResponse, type NextRequest } from "next/server";

import { resolvePostAuthDestination } from "@/features/auth/services/post-auth-redirect.service";
import { AUTH_ROUTES } from "@/features/auth/types";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? AUTH_ROUTES.customer;
  const destination = await resolvePostAuthDestination(next);

  return NextResponse.redirect(`${origin}${destination}`);
}
