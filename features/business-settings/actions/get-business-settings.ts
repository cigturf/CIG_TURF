"use server";

import type { BusinessSettings, BusinessSettingsPublic } from "@/features/business-settings/types";
import { SettingsService } from "@/server/settings/settings.service";

export async function getBusinessSettingsAction(): Promise<BusinessSettings | null> {
  return SettingsService.get();
}

export async function getPublicBusinessSettingsAction(): Promise<BusinessSettingsPublic | null> {
  return SettingsService.getPublic();
}

export async function isBusinessSettingsConfiguredAction(): Promise<boolean> {
  return SettingsService.isConfigured();
}
