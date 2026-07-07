import { z } from "zod";

import { getAppEnvironment, type AppEnvironment } from "@/config/runtime.config";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  DIRECT_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  BREVO_API_KEY: z.string().optional(),
  BREVO_SENDER_EMAIL: z.string().email().optional(),
  BREVO_SENDER_NAME: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).optional(),
});

const deployedServerEnvSchema = z.object({
  DATABASE_URL: z.string().url().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().min(1),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().min(1),
  BREVO_API_KEY: z.string().min(1),
  BREVO_SENDER_EMAIL: z.string().email().min(1),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3001"),
  NEXT_PUBLIC_APP_NAME: z.string().default("Chandna Indoor Ground"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional(),
});

function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function shouldValidateDeployedSecrets(environment: AppEnvironment): boolean {
  if (isBuildPhase()) return false;
  return environment === "production" || environment === "preview";
}

function validateDeployedEnvironment(environment: AppEnvironment): void {
  if (!shouldValidateDeployedSecrets(environment)) return;

  const result = deployedServerEnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error(
      `[env] Missing or invalid variables for ${environment}:`,
      result.error.flatten().fieldErrors,
    );
    throw new Error(`Missing required ${environment} environment variables`);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  if (
    environment === "production" &&
    (appUrl.includes("localhost") || appUrl.includes("127.0.0.1"))
  ) {
    throw new Error("NEXT_PUBLIC_APP_URL must not point to localhost in production");
  }
}

function createEnv() {
  const environment = getAppEnvironment();
  validateDeployedEnvironment(environment);

  const server = serverEnvSchema.safeParse(process.env);
  const client = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  });

  if (!client.success) {
    console.error("Invalid client environment variables:", client.error.flatten());
    throw new Error("Invalid client environment variables");
  }

  const razorpayMode = client.data.NEXT_PUBLIC_RAZORPAY_KEY_ID?.startsWith("rzp_live")
    ? "live"
    : client.data.NEXT_PUBLIC_RAZORPAY_KEY_ID?.startsWith("rzp_test")
      ? "test"
      : "unknown";

  return {
    ...client.data,
    environment,
    razorpayMode,
    server: server.success ? server.data : ({} as z.infer<typeof serverEnvSchema>),
    email: {
      apiKey: process.env.BREVO_API_KEY?.trim() ?? "",
      senderEmail: process.env.BREVO_SENDER_EMAIL?.trim() ?? "",
      senderName: process.env.BREVO_SENDER_NAME?.trim() || client.data.NEXT_PUBLIC_APP_NAME,
      isConfigured: Boolean(
        process.env.BREVO_API_KEY?.trim() && process.env.BREVO_SENDER_EMAIL?.trim(),
      ),
    },
    sentry: {
      dsn: process.env.SENTRY_DSN?.trim() ?? "",
      environment: process.env.SENTRY_ENVIRONMENT?.trim() || environment,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0),
      enabled: Boolean(process.env.SENTRY_DSN?.trim()),
    },
  };
}

export const env = createEnv();

export function getRazorpayWebhookSecret(): string | null {
  return env.server.RAZORPAY_WEBHOOK_SECRET ?? env.server.RAZORPAY_KEY_SECRET ?? null;
}
