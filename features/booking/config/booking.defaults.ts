import type { BookingBusinessHours } from "@/features/booking/types";
import { DEFAULT_SLOT_PRICE } from "@/features/pricing/config/pricing.defaults";

/**
 * Temporary booking defaults.
 * Single source of truth until Business Settings exposes these fields.
 */
export const BOOKING_DEFAULTS = {
  slotDurationMinutes: 30,
  businessHours: {
    openTime: "00:00",
    closeTime: "23:59",
  } satisfies BookingBusinessHours,
  bookingWindowDays: 7,
  fixedAdvanceAmount: 200,
  defaultSlotPrice: DEFAULT_SLOT_PRICE,
  currency: "INR",
  weekendPricing: {
    enabled: false,
    multiplier: 1.2,
  },
  holidayPricing: {
    enabled: false,
    holidayDates: [] as string[],
    multiplier: 1.0,
  },
  peakHourPricing: {
    enabled: false,
    startTime: "18:00",
    endTime: "22:00",
    multiplier: 1.15,
  },
  maxConsecutiveDurationMinutes: 240,
  minBookingDurationMinutes: 30,
  crossMidnightBridgeMinutes: 240,
} as const;
