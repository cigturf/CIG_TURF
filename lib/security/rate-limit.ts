import { isCsrfProtectedMethod } from "@/lib/security/csrf";

export type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

const RATE_LIMITS = {
  auth: { limit: 20, windowMs: 60_000 },
  otp: { limit: 5, windowMs: 60_000 },
  payment: { limit: 30, windowMs: 60_000 },
  booking: { limit: 40, windowMs: 60_000 },
  admin: { limit: 180, windowMs: 60_000 },
  public: { limit: 120, windowMs: 60_000 },
  audit: { limit: 200, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitConfig>;

export type RateLimitScope = keyof typeof RATE_LIMITS;

export function resolveRateLimitScope(pathname: string): RateLimitScope {
  if (pathname.startsWith("/api/auth/")) return "auth";
  if (pathname.startsWith("/api/payments/")) return "payment";
  if (pathname.startsWith("/api/bookings/")) return "booking";
  if (pathname.startsWith("/api/audit/")) return "audit";
  if (pathname.startsWith("/api/admin/")) return "admin";
  return "public";
}

/** Only mutating API calls are rate limited — reads must stay unrestricted for admin UIs. */
export function shouldRateLimitRequest(method: string): boolean {
  return isCsrfProtectedMethod(method);
}

export function shouldBypassRateLimit(pathname: string): boolean {
  return pathname === "/api/health" || pathname === "/api/payments/webhook";
}

export function isRateLimitEnabled(): boolean {
  return process.env.NODE_ENV === "production";
}

export function getRateLimitConfig(scope: RateLimitScope): RateLimitConfig {
  return RATE_LIMITS[scope];
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
  now = Date.now(),
): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + config.windowMs });
    return { ok: true };
  }

  if (existing.count >= config.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return { ok: false, retryAfterSeconds };
  }

  existing.count += 1;
  return { ok: true };
}

export function buildRateLimitKey(scope: RateLimitScope, ip: string): string {
  return `${scope}:${ip}`;
}

/** Test helper */
export function resetRateLimitsForTests(): void {
  buckets.clear();
}
