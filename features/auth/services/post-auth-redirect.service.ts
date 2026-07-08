import { checkIsAdminAction, getSessionUserAction } from "@/features/auth/actions/auth.actions";
import { AUTH_ROUTES, isBookingFlowReturn } from "@/features/auth/types";
import { buildLoginUrl } from "@/features/auth/utils/redirect";

/**
 * Resolves where an authenticated user should land next.
 * Admin checks happen only here — never exposed to unauthenticated clients.
 */
export async function resolvePostAuthDestination(returnTo: string | null): Promise<string> {
  const user = await getSessionUserAction();
  if (!user) {
    return buildLoginUrl(returnTo ?? AUTH_ROUTES.customer);
  }

  if (await checkIsAdminAction(user.id)) {
    return AUTH_ROUTES.admin;
  }

  const next = returnTo ?? AUTH_ROUTES.customer;

  if (!user.profileComplete && !isBookingFlowReturn(next)) {
    return buildLoginUrl(next);
  }

  return next;
}
