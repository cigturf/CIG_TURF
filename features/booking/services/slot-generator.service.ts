import type { BookingEngineConfig, BookingSlot, SlotStatus } from "@/features/booking/types";
import { resolveSlotPrice } from "@/features/pricing/services/pricing-engine.service";
import type { PricingSnapshot } from "@/features/pricing/types/pricing.types";
import {
  createDateAtMinutes,
  formatMinutesAsTime,
  formatSlotTimeRange,
  getOperatingWindow,
} from "@/features/booking/utils/time";
import {
  getTodayIsoInTimezone,
  isPastSlotEndInTimezone,
} from "@/features/booking/utils/venue-timezone";

type GenerateSlotsOptions = {
  dateIso: string;
  config: BookingEngineConfig;
  now?: Date;
  selectedSlotIds?: string[];
  bookedSlotIds?: Set<string> | string[];
  heldSlotIds?: Set<string> | string[];
  blockedSlotIds?: Set<string> | string[];
  maintenanceSlotIds?: Set<string> | string[];
  isHoliday?: boolean;
  pricing?: PricingSnapshot;
};

function isInSet(slotId: string, slotIds?: Set<string> | string[]): boolean {
  if (!slotIds) return false;
  if (slotIds instanceof Set) return slotIds.has(slotId);
  return slotIds.includes(slotId);
}

/**
 * Generates booking slots for a date using business hours and slot duration.
 */
export function generateSlots({
  dateIso,
  config,
  now = new Date(),
  selectedSlotIds = [],
  bookedSlotIds,
  heldSlotIds,
  blockedSlotIds,
  maintenanceSlotIds,
  isHoliday = false,
  pricing,
}: GenerateSlotsOptions): BookingSlot[] {
  const { startMinutes, endExclusiveMinutes } = getOperatingWindow(config.businessHours);
  const isToday = dateIso === getTodayIsoInTimezone(now, config.timezone);
  const slots: BookingSlot[] = [];
  let sortOrder = 0;

  for (
    let startMinute = startMinutes;
    startMinute + config.slotDurationMinutes <= endExclusiveMinutes;
    startMinute += config.slotDurationMinutes
  ) {
    const endMinute = startMinute + config.slotDurationMinutes;
    const startDate = createDateAtMinutes(dateIso, startMinute);
    const endDate = createDateAtMinutes(dateIso, endMinute % (24 * 60));
    const slotId = `${dateIso}-${startMinute}`;

    let baseStatus: SlotStatus = "available";
    if (isHoliday) baseStatus = "holiday";
    if (isInSet(slotId, blockedSlotIds)) baseStatus = "blocked";
    if (isInSet(slotId, maintenanceSlotIds)) baseStatus = "maintenance";
    if (isInSet(slotId, bookedSlotIds)) baseStatus = "booked";
    else if (isInSet(slotId, heldSlotIds)) baseStatus = "reserved";
    const isPast = isToday && isPastSlotEndInTimezone(dateIso, endMinute, now, config.timezone);
    const status: SlotStatus = isPast ? "past" : baseStatus;
    const isSelectable = status === "available";
    const isSelected = selectedSlotIds.includes(slotId);

    const price = pricing
      ? resolveSlotPrice({ snapshot: pricing, dateIso, startMinute })
      : config.defaultSlotPrice;

    slots.push({
      id: slotId,
      sortOrder,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      duration: config.slotDurationMinutes,
      timeLabel: formatSlotTimeRange(startMinute, endMinute),
      startTimeLabel: formatMinutesAsTime(startMinute),
      endTimeLabel: formatMinutesAsTime(endMinute % (24 * 60)),
      price,
      status,
      isPast,
      isSelectable,
      isSelected,
    });

    sortOrder += 1;
  }

  return slots;
}

/** @deprecated Use generateSlots */
export function generatePlaceholderSlots(
  dateIso: string,
  config: Pick<BookingEngineConfig, "slotDurationMinutes" | "defaultSlotPrice" | "businessHours">,
  now?: Date,
): BookingSlot[] {
  return generateSlots({
    dateIso,
    config: {
      ...config,
      bookingWindowDays: 7,
      fixedAdvanceAmount: 200,
      currency: "INR",
      weekendPricing: { enabled: false, multiplier: 1 },
      holidayPricing: { enabled: false, holidayDates: [], multiplier: 1 },
      peakHourPricing: { enabled: false, startTime: "18:00", endTime: "22:00", multiplier: 1 },
      maxConsecutiveDurationMinutes: 240,
      minBookingDurationMinutes: 30,
      crossMidnightBridgeMinutes: 240,
      timezone: "Asia/Kolkata",
    },
    now,
  });
}
