import { NextResponse } from "next/server";

import { captureError } from "@/lib/monitoring/capture-error";
import { safeLogError } from "@/lib/security/safe-logger";

export function apiErrorResponse(
  message: string,
  status: number,
  context?: string,
  cause?: unknown,
): NextResponse {
  if (cause) {
    safeLogError(context ?? "api", cause);
    captureError(cause, { context: context ?? "api" });
  }

  return NextResponse.json({ error: message }, { status });
}

export function parseJsonBodyError(): NextResponse {
  return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
}

export function validationErrorResponse(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbiddenResponse(): NextResponse {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export function rateLimitedResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please try again shortly." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    },
  );
}

export function csrfRejectedResponse(): NextResponse {
  return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
}
