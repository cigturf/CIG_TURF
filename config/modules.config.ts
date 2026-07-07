/**
 * Module registry keys for the central configuration layer.
 * Future modules register and consume settings through these keys.
 */
export const MODULE_KEYS = {
  businessSettings: "business-settings",
  booking: "booking",
  pricing: "pricing",
  notifications: "notifications",
  landing: "landing",
  admin: "admin",
} as const;

export type ModuleKey = (typeof MODULE_KEYS)[keyof typeof MODULE_KEYS];
