import { NextResponse, type NextRequest } from "next/server";

import { resolvePostAuthDestination } from "@/features/auth/services/post-auth-redirect.service";
import { getProfileById } from "@/features/auth/services/profile.service";
import { CommunicationService } from "@/features/communication/services/communication.service";
import { AUTH_ROUTES } from "@/features/auth/types";
import {
  clearAuthReturnToOnResponse,
  readAuthReturnToFromRequest,
} from "@/features/auth/utils/auth-return-to.server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = readAuthReturnToFromRequest(request, searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(`${origin}${AUTH_ROUTES.login}?error=auth`);
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[Auth callback] Session exchange failed:", error.message);
      return NextResponse.redirect(`${origin}${AUTH_ROUTES.login}?error=auth`);
    }

    const destination = await resolvePostAuthDestination(next);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email) {
      const existingProfile = await getProfileById(user.id);
      if (!existingProfile) {
        void CommunicationService.sendWelcomeEmail({
          email: user.email,
          customerName:
            (user.user_metadata?.full_name as string | undefined) ??
            user.email.split("@")[0] ??
            "Player",
        }).catch((error) => {
          console.error("[Auth callback] Welcome email failed:", error);
        });
      }
    }

    return clearAuthReturnToOnResponse(
      NextResponse.redirect(`${origin}${destination}`),
    );
  } catch (error) {
    console.error("[Auth callback] Unexpected error:", error);
    return clearAuthReturnToOnResponse(
      NextResponse.redirect(`${origin}${AUTH_ROUTES.login}?error=auth`),
    );
  }
}
