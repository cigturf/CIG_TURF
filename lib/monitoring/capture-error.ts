import { safeLogError, safeLogWarn } from "@/lib/security/safe-logger";

type ErrorContext = Record<string, unknown>;

/**
 * Centralized server error capture.
 * Sentry is optional — set SENTRY_DSN and install @sentry/nextjs (see docs/DEPLOYMENT.md).
 */
export async function initErrorMonitoring(): Promise<void> {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;

  safeLogWarn(
    "monitoring",
    "SENTRY_DSN is configured. Install @sentry/nextjs and follow docs/DEPLOYMENT.md to enable Sentry.",
  );
}

export function captureError(error: unknown, context?: ErrorContext): void {
  safeLogError("captured", error, context);
}
