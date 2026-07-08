import { AUTH_ROUTES, isBookingFlowReturn } from "@/features/auth/types";

export function resolvePostAuthRedirect(options: {
  isAdmin: boolean;
  profileComplete: boolean;
  returnTo: string | null;
  isOnboarding?: boolean;
}): string | null {
  if (options.isOnboarding) return null;
  if (options.isAdmin) return AUTH_ROUTES.admin;
  if (!options.profileComplete && !isBookingFlowReturn(options.returnTo ?? "")) {
    return null;
  }
  return options.returnTo ?? AUTH_ROUTES.customer;
}

export function buildLoginUrl(returnTo: string): string {
  return `${AUTH_ROUTES.login}?returnTo=${encodeURIComponent(returnTo)}`;
}

export function buildAuthContinueUrl(returnTo: string | null): string {
  const next = returnTo ?? AUTH_ROUTES.customer;
  return `/api/auth/continue?next=${encodeURIComponent(next)}`;
}
