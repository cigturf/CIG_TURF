import { hasBookingSession } from "@/features/booking/utils/booking-session";
import { AUTH_ROUTES } from "@/features/auth/types";

import {
  AUTH_RETURN_TO_COOKIE,
  AUTH_RETURN_TO_MAX_AGE_SECONDS,
} from "./auth-return-to.constants";
import { resolveAuthReturnPath, sanitizeAuthReturnPath } from "./auth-return-to.shared";

function cookieSecureFlag(): string {
  return typeof window !== "undefined" && window.location.protocol === "https:"
    ? "; Secure"
    : "";
}

/** Prefer checkout when the user already picked slots on /book. */
export function resolveLoginReturnTo(pathname: string | null): string {
  if (pathname === AUTH_ROUTES.bookingDetails) {
    return AUTH_ROUTES.bookingDetails;
  }

  if (pathname === AUTH_ROUTES.book && hasBookingSession()) {
    return AUTH_ROUTES.bookingDetails;
  }

  if (pathname && pathname !== AUTH_ROUTES.login) {
    return pathname;
  }

  return AUTH_ROUTES.customer;
}

export function resolveAuthReturnTo(
  returnTo: string | null | undefined,
): string {
  if (returnTo === AUTH_ROUTES.book && hasBookingSession()) {
    return AUTH_ROUTES.bookingDetails;
  }

  return resolveAuthReturnPath(returnTo);
}

export function persistAuthReturnTo(returnTo: string | null | undefined): void {
  if (typeof document === "undefined") return;

  const path = sanitizeAuthReturnPath(returnTo);
  if (!path) return;

  document.cookie = `${AUTH_RETURN_TO_COOKIE}=${encodeURIComponent(path)}; path=/; max-age=${AUTH_RETURN_TO_MAX_AGE_SECONDS}; SameSite=Lax${cookieSecureFlag()}`;
}

export function clearAuthReturnToCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_RETURN_TO_COOKIE}=; path=/; max-age=0; SameSite=Lax${cookieSecureFlag()}`;
}
