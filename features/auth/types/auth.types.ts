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
  | "email-signin"
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
  bookingDetails: "/book/details",
} as const;
