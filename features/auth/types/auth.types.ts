export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  profileComplete: boolean;
  image?: string | null;
};

export type LoginMode =
  | "choose"
  | "admin-signin"
  | "email-otp"
  | "forgot-password"
  | "onboarding";

export type ProfileCompletionInput = {
  name: string;
  phone: string;
};

export const AUTH_ROUTES = {
  login: "/login",
  customer: "/customer",
  admin: "/admin",
  book: "/book",
  bookingDetails: "/book/details",
} as const;

export function isBookingFlowReturn(returnTo: string): boolean {
  return returnTo === AUTH_ROUTES.bookingDetails || returnTo === AUTH_ROUTES.book;
}
