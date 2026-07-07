import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";
import {
  applySecurityHeaders,
  buildRateLimitKey,
  checkRateLimit,
  csrfRejectedResponse,
  getClientIp,
  getRateLimitConfig,
  isRateLimitEnabled,
  rateLimitedResponse,
  resolveRateLimitScope,
  shouldRateLimitRequest,
  verifyCsrfOrigin,
} from "@/lib/security";

const isProduction = process.env.NODE_ENV === "production";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/")) {
    if (!verifyCsrfOrigin(request)) {
      return applySecurityHeaders(csrfRejectedResponse(), isProduction);
    }

    if (isRateLimitEnabled() && shouldRateLimitRequest(request.method)) {
      const scope = resolveRateLimitScope(pathname);
      const rateLimit = checkRateLimit(
        buildRateLimitKey(scope, getClientIp(request)),
        getRateLimitConfig(scope),
      );

      if (!rateLimit.ok) {
        return applySecurityHeaders(
          rateLimitedResponse(rateLimit.retryAfterSeconds),
          isProduction,
        );
      }
    }
  }

  const response = await updateSession(request);
  return applySecurityHeaders(response, isProduction);
}

export const config = {
  matcher: [
    "/api/:path*",
    "/customer/:path*",
    "/admin/:path*",
    "/book/details/:path*",
    "/booking/:path*",
  ],
};
