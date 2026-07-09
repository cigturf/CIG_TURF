import { NextResponse } from "next/server";

import { runHealthCheck } from "@/lib/health/health-check";
import { captureError } from "@/lib/monitoring/capture-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await runHealthCheck();
    const statusCode = result.status === "error" ? 503 : 200;

    return NextResponse.json(
      {
        status: result.status,
        timestamp: result.timestamp,
        checks: result.checks,
      },
      {
        status: statusCode,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    captureError(error, { route: "health" });
    return NextResponse.json(
      {
        status: "error",
        message: "Health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
