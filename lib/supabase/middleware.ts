import { type NextRequest, NextResponse } from "next/server";

import { AUTH_ROUTES } from "@/features/auth/types";

const AUTH_COOKIE_PATTERN = /^sb-.*-auth-token/;

function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((cookie) => AUTH_COOKIE_PATTERN.test(cookie.name));
}

// Presence-only check — no Supabase Auth network call here. A stale or expired
// cookie still lets the request through; each protected page/API route does its
// own authoritative supabase.auth.getUser() check. Calling Supabase from here
// used to block on a live Auth API round-trip for every request, which caused
// MIDDLEWARE_INVOCATION_TIMEOUT (504s) whenever Supabase Auth was slow to respond.
export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtectedRoute =
    pathname.startsWith(AUTH_ROUTES.customer) ||
    pathname.startsWith(AUTH_ROUTES.bookingDetails);

  if (isProtectedRoute && !hasSessionCookie(request)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = AUTH_ROUTES.login;
    loginUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next({ request });
}
