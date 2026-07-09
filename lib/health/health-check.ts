import { APP_VERSION } from "@/config/version.config";
import { getAppEnvironment } from "@/config/runtime.config";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export type HealthComponentStatus = "ok" | "degraded" | "error" | "not_configured";

export type HealthCheckResult = {
  status: "ok" | "degraded" | "error";
  version: string;
  environment: ReturnType<typeof getAppEnvironment>;
  timestamp: string;
  checks: {
    database: HealthComponentStatus;
    storage: HealthComponentStatus;
    email: HealthComponentStatus;
    razorpay: HealthComponentStatus;
  };
};

async function checkDatabaseWithSupabase(): Promise<HealthComponentStatus | null> {
  const supabase = createServiceRoleClient();
  if (!supabase) return null;

  try {
    const { error } = await supabase.from("business_settings").select("id").limit(1);
    return error ? "error" : "ok";
  } catch {
    return "error";
  }
}

async function checkDatabaseWithPrisma(): Promise<HealthComponentStatus> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return "ok";
  } catch {
    return "error";
  }
}

async function checkDatabase(): Promise<HealthComponentStatus> {
  const supabaseStatus = await checkDatabaseWithSupabase();
  if (supabaseStatus === "ok") return "ok";

  const prismaStatus = await checkDatabaseWithPrisma();
  if (prismaStatus === "ok") return "ok";

  return "error";
}

async function checkStorage(): Promise<HealthComponentStatus> {
  const supabase = createServiceRoleClient();
  if (!supabase) return "not_configured";

  try {
    const { error } = await supabase.storage.from("media").list("", { limit: 1 });
    return error ? "error" : "ok";
  } catch {
    return "error";
  }
}

function checkEmail(): HealthComponentStatus {
  if (!env.email.isConfigured) {
    return getAppEnvironment() === "development" ? "not_configured" : "degraded";
  }
  return "ok";
}

function checkRazorpay(): HealthComponentStatus {
  if (!env.server.RAZORPAY_KEY_ID || !env.server.RAZORPAY_KEY_SECRET) {
    return "not_configured";
  }
  if (!env.NEXT_PUBLIC_RAZORPAY_KEY_ID) return "degraded";
  if (
    (getAppEnvironment() === "production" || getAppEnvironment() === "preview") &&
    !env.server.RAZORPAY_WEBHOOK_SECRET?.trim()
  ) {
    return "degraded";
  }
  return "ok";
}

function aggregateStatus(checks: HealthCheckResult["checks"]): HealthCheckResult["status"] {
  const values = Object.values(checks);
  if (values.includes("error")) return "error";
  if (values.includes("degraded")) return "degraded";
  return "ok";
}

export async function runHealthCheck(): Promise<HealthCheckResult> {
  const [database, storage] = await Promise.all([checkDatabase(), checkStorage()]);

  const checks = {
    database,
    storage,
    email: checkEmail(),
    razorpay: checkRazorpay(),
  };

  return {
    status: aggregateStatus(checks),
    version: APP_VERSION,
    environment: getAppEnvironment(),
    timestamp: new Date().toISOString(),
    checks,
  };
}
