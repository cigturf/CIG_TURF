export type AppEnvironment = "development" | "preview" | "production";

/**
 * Resolves the active deployment environment.
 * - production: Vercel production or NODE_ENV=production
 * - preview: Vercel preview deployments
 * - development: local dev
 */
export function getAppEnvironment(): AppEnvironment {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === "production") return "production";
  if (vercelEnv === "preview") return "preview";
  if (process.env.NODE_ENV === "production") return "production";
  return "development";
}

export function isProductionEnvironment(): boolean {
  return getAppEnvironment() === "production";
}

export function isDeployedEnvironment(): boolean {
  const env = getAppEnvironment();
  return env === "production" || env === "preview";
}
