import type { BookingEngineConfig, BookingSlot } from "@/features/booking/types";
import { generateSlots } from "@/features/booking/services/slot-generator.service";
import type { PricingSnapshot } from "@/features/pricing/types/pricing.types";
import { parseSlotId } from "@/features/booking/utils/slot-id";
import {
  getBridgeDateIso,
  getNextDayBridgeEndMinute,
} from "@/features/booking/utils/slot-timeline";

type SlotAvailability = {
  bookedSlotIds?: Set<string> | string[];
  heldSlotIds?: Set<string> | string[];
  blockedSlotIds?: Set<string> | string[];
  maintenanceSlotIds?: Set<string> | string[];
  slotReasons?: Record<string, string>;
  isHoliday?: boolean;
};

export type BookingViewSlotsResult = {
  slots: BookingSlot[];
  bridgeDateIso: string | null;
  bridgeStartIndex: number;
};

type BuildBookingViewSlotsOptions = {
  dateIso: string;
  config: BookingEngineConfig;
  now?: Date;
  selectedSlotIds?: string[];
  primaryAvailability: SlotAvailability;
  bridgeAvailability?: SlotAvailability;
  pricing?: PricingSnapshot;
  /**
   * Drop today's already-ended slots from the result instead of returning
   * them disabled. Only the customer-facing booking flow sets this — admin
   * (slot management, the manual/walk-in booking dialog, order validation)
   * must keep seeing every slot, past included, to look up who booked what.
   */
  hidePastSlots?: boolean;
};

export function buildBookingViewSlots({
  dateIso,
  config,
  now,
  selectedSlotIds = [],
  primaryAvailability,
  bridgeAvailability,
  pricing,
  hidePastSlots = false,
}: BuildBookingViewSlotsOptions): BookingViewSlotsResult {
  const primarySlots = generateSlots({
    dateIso,
    config,
    now,
    selectedSlotIds,
    bookedSlotIds: primaryAvailability.bookedSlotIds,
    heldSlotIds: primaryAvailability.heldSlotIds,
    blockedSlotIds: primaryAvailability.blockedSlotIds,
    maintenanceSlotIds: primaryAvailability.maintenanceSlotIds,
    slotReasons: primaryAvailability.slotReasons,
    isHoliday: primaryAvailability.isHoliday ?? false,
    pricing,
  });

  const bridgeDateIso = getBridgeDateIso(dateIso);
  const bridgeEndMinute = getNextDayBridgeEndMinute(config);
  const bridgeSource = generateSlots({
    dateIso: bridgeDateIso,
    config,
    now,
    selectedSlotIds,
    bookedSlotIds: bridgeAvailability?.bookedSlotIds,
    heldSlotIds: bridgeAvailability?.heldSlotIds,
    blockedSlotIds: bridgeAvailability?.blockedSlotIds,
    maintenanceSlotIds: bridgeAvailability?.maintenanceSlotIds,
    slotReasons: bridgeAvailability?.slotReasons,
    isHoliday: bridgeAvailability?.isHoliday ?? false,
    pricing,
  });

  const visiblePrimarySlots = hidePastSlots
    ? primarySlots.filter((slot) => !slot.isPast)
    : primarySlots;

  const bridgeSlots = bridgeSource
    .filter((slot) => {
      const parsed = parseSlotId(slot.id);
      return parsed !== null && parsed.startMinute < bridgeEndMinute;
    })
    .filter((slot) => !hidePastSlots || !slot.isPast)
    .map((slot, index) => ({
      ...slot,
      // Offset by the original (unfiltered) primary count so sortOrder stays
      // chronologically ahead of every primary slot, even when some of the
      // earliest ones were dropped for being in the past.
      sortOrder: primarySlots.length + index,
    }));

  if (bridgeSlots.length === 0) {
    return { slots: visiblePrimarySlots, bridgeDateIso: null, bridgeStartIndex: -1 };
  }

  return {
    slots: [...visiblePrimarySlots, ...bridgeSlots],
    bridgeDateIso,
    bridgeStartIndex: visiblePrimarySlots.length,
  };
}
