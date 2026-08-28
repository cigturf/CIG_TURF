import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { AUTH_ROUTES } from "@/features/auth/types";

const AUTH_LOOKUP_TIMEOUT_MS = 4_000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeoutId = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // Cookie-based lookup avoids a Supabase Auth round-trip on every request.
  // Protected pages and APIs still validate with getUser() in server handlers.
  const {
    data: { session },
  } = await withTimeout(
    supabase.auth.getSession(),
    AUTH_LOOKUP_TIMEOUT_MS,
    { data: { session: null }, error: null },
  );

  const user = session?.user ?? null;

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute =
    pathname.startsWith(AUTH_ROUTES.customer) ||
    pathname.startsWith(AUTH_ROUTES.bookingDetails);

  if (isProtectedRoute && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = AUTH_ROUTES.login;
    loginUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}
