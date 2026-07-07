import { env } from "@/lib/env";

export type AppConfig = {
  /** Technical app URL — not business branding */
  url: string;
  /** Fallback display name from env until business settings are loaded */
  envDisplayName: string;
  isDevelopment: boolean;
  isProduction: boolean;
};

let cachedAppConfig: AppConfig | null = null;

/**
 * Application-level technical configuration sourced from environment variables.
 * Business-facing values (name, branding, pricing) come from Business Settings.
 */
export function getAppConfig(): AppConfig {
  if (cachedAppConfig) return cachedAppConfig;

  cachedAppConfig = {
    url: env.NEXT_PUBLIC_APP_URL,
    envDisplayName: env.NEXT_PUBLIC_APP_NAME,
    isDevelopment: process.env.NODE_ENV === "development",
    isProduction: process.env.NODE_ENV === "production",
  };

  return cachedAppConfig;
}
