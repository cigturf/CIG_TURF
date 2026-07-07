import type { BookingEngineConfig } from "@/features/booking/types";
import { parseTimeToMinutes } from "@/features/booking/utils/time";

type SlotPricingInput = {
  dateIso: string;
  startMinute: number;
  basePrice: number;
};

function isWeekend(dateIso: string): boolean {
  const day = new Date(`${dateIso}T12:00:00`).getDay();
  return day === 0 || day === 6;
}

function isHoliday(dateIso: string, config: BookingEngineConfig): boolean {
  if (!config.holidayPricing.enabled) return false;
  return config.holidayPricing.holidayDates.includes(dateIso);
}

function isPeakHour(startMinute: number, config: BookingEngineConfig): boolean {
  if (!config.peakHourPricing.enabled) return false;
  const peakStart = parseTimeToMinutes(config.peakHourPricing.startTime);
  const peakEnd = parseTimeToMinutes(config.peakHourPricing.endTime);
  return startMinute >= peakStart && startMinute < peakEnd;
}

/**
 * Calculates the price for a single slot.
 * Architecture supports weekend, holiday, and peak-hour multipliers.
 */
export function calculateSlotPrice(
  input: SlotPricingInput,
  config: BookingEngineConfig,
): number {
  let price = input.basePrice;

  if (config.weekendPricing.enabled && isWeekend(input.dateIso)) {
    price = Math.round(price * config.weekendPricing.multiplier);
  }

  if (config.holidayPricing.enabled && isHoliday(input.dateIso, config)) {
    price = Math.round(price * config.holidayPricing.multiplier);
  }

  if (config.peakHourPricing.enabled && isPeakHour(input.startMinute, config)) {
    price = Math.round(price * config.peakHourPricing.multiplier);
  }

  return price;
}
