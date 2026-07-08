import type { NextRequest, NextResponse } from "next/server";

import { AUTH_ROUTES } from "@/features/auth/types";

import { AUTH_RETURN_TO_COOKIE } from "./auth-return-to.constants";
import { resolveAuthReturnPath, sanitizeAuthReturnPath } from "./auth-return-to.shared";

export function readAuthReturnToFromRequest(
  request: NextRequest,
  queryNext: string | null,
): string {
  const fromQuery = sanitizeAuthReturnPath(queryNext);
  if (fromQuery) return fromQuery;

  const rawCookie = request.cookies.get(AUTH_RETURN_TO_COOKIE)?.value;
  if (rawCookie) {
    const decoded = decodeURIComponent(rawCookie);
    const fromCookie = sanitizeAuthReturnPath(decoded);
    if (fromCookie) return fromCookie;
  }

  return AUTH_ROUTES.customer;
}

export function clearAuthReturnToOnResponse(response: NextResponse): NextResponse {
  response.cookies.set(AUTH_RETURN_TO_COOKIE, "", {
    path: "/",
    maxAge: 0,
  });
  return response;
}

export { resolveAuthReturnPath };
