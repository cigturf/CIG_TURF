import type { BusinessSettingsPublic } from "@/features/business-settings/types";

/** Client-safe fetch — avoids Server Action IDs going stale under React Query. */
export async function fetchPublicBusinessSettings(): Promise<BusinessSettingsPublic | null> {
  const response = await fetch("/api/settings/public", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load business settings");
  }
  const data = (await response.json()) as { settings: BusinessSettingsPublic | null };
  return data.settings;
}
