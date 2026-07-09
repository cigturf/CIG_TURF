import type { BusinessSettingsPublic } from "@/features/business-settings/types";
import { BOOKING_DEFAULTS } from "@/features/booking/config";
import { resolveVenueTimezone } from "@/features/booking/utils/venue-timezone";
import { DEFAULT_SLOT_PRICE } from "@/features/pricing/config/pricing.defaults";
import type { BookingEngineConfig } from "@/features/booking/types";

/**
 * Resolves the booking engine configuration from Business Settings.
 * Slot prices come from the smart pricing engine; this fallback is used only
 * when a pricing snapshot is unavailable.
 */
export function resolveBookingEngineConfig(
  settings: BusinessSettingsPublic,
): BookingEngineConfig {
  const slotDurationMinutes = BOOKING_DEFAULTS.slotDurationMinutes;

  return {
    slotDurationMinutes,
    businessHours: { ...BOOKING_DEFAULTS.businessHours },
    bookingWindowDays: BOOKING_DEFAULTS.bookingWindowDays,
    fixedAdvanceAmount: BOOKING_DEFAULTS.fixedAdvanceAmount,
    defaultSlotPrice: DEFAULT_SLOT_PRICE,
    currency: settings.pricing.currency ?? BOOKING_DEFAULTS.currency,
    weekendPricing: { ...BOOKING_DEFAULTS.weekendPricing },
    holidayPricing: {
      ...BOOKING_DEFAULTS.holidayPricing,
      holidayDates: [...BOOKING_DEFAULTS.holidayPricing.holidayDates],
    },
    peakHourPricing: { ...BOOKING_DEFAULTS.peakHourPricing },
    maxConsecutiveDurationMinutes: BOOKING_DEFAULTS.maxConsecutiveDurationMinutes,
    minBookingDurationMinutes: BOOKING_DEFAULTS.minBookingDurationMinutes,
    crossMidnightBridgeMinutes: BOOKING_DEFAULTS.crossMidnightBridgeMinutes,
    timezone: resolveVenueTimezone(settings.operations.timezone),
  };
}

/** @deprecated Use resolveBookingEngineConfig */
export const resolveBookingUiConfig = resolveBookingEngineConfig;
