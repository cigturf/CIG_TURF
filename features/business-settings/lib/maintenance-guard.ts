import { SettingsService } from "@/server/settings/settings.service";

export type MaintenanceState = {
  active: boolean;
  message: string | null;
};

export async function getMaintenanceState(): Promise<MaintenanceState> {
  const settings = await SettingsService.getOrEmpty();
  return {
    active: settings.operations.maintenanceMode === true,
    message: settings.operations.maintenanceMessage,
  };
}

export async function isBookingMaintenanceActive(): Promise<boolean> {
  const state = await getMaintenanceState();
  return state.active;
}
