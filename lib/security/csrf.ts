import type { NextRequest } from "next/server";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function normalizeOrigin(value: string): string {
  return value.replace(/\/$/, "").toLowerCase();
}

function allowedOrigins(request: NextRequest): string[] {
  const origins = new Set<string>();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) origins.add(normalizeOrigin(appUrl));

  const host = request.headers.get("host");
  if (host) {
    origins.add(normalizeOrigin(`https://${host}`));
    if (process.env.NODE_ENV !== "production") {
      origins.add(normalizeOrigin(`http://${host}`));
    }
  }

  return [...origins];
}

export function isCsrfProtectedMethod(method: string): boolean {
  return MUTATING_METHODS.has(method.toUpperCase());
}

/**
 * Cookie-authenticated API routes must originate from this app.
 * Safe methods and server-to-server calls without cookies are unaffected.
 */
export function verifyCsrfOrigin(request: NextRequest): boolean {
  if (!isCsrfProtectedMethod(request.method)) return true;

  const pathname = request.nextUrl.pathname;
  if (!pathname.startsWith("/api/")) return true;

  if (pathname === "/api/payments/webhook") return true;

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const allowed = allowedOrigins(request);

  if (origin) {
    return allowed.includes(normalizeOrigin(origin));
  }

  if (referer) {
    try {
      const refererOrigin = normalizeOrigin(new URL(referer).origin);
      return allowed.includes(refererOrigin);
    } catch {
      return false;
    }
  }

  // Non-browser clients (no Origin/Referer) are allowed; auth still required per route.
  return true;
}
