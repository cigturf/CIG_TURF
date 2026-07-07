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
  blockedSlotIds?: Set<string> | string[];
  maintenanceSlotIds?: Set<string> | string[];
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
};

export function buildBookingViewSlots({
  dateIso,
  config,
  now,
  selectedSlotIds = [],
  primaryAvailability,
  bridgeAvailability,
  pricing,
}: BuildBookingViewSlotsOptions): BookingViewSlotsResult {
  const primarySlots = generateSlots({
    dateIso,
    config,
    now,
    selectedSlotIds,
    bookedSlotIds: primaryAvailability.bookedSlotIds,
    blockedSlotIds: primaryAvailability.blockedSlotIds,
    maintenanceSlotIds: primaryAvailability.maintenanceSlotIds,
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
    blockedSlotIds: bridgeAvailability?.blockedSlotIds,
    maintenanceSlotIds: bridgeAvailability?.maintenanceSlotIds,
    isHoliday: bridgeAvailability?.isHoliday ?? false,
    pricing,
  });

  const bridgeSlots = bridgeSource
    .filter((slot) => {
      const parsed = parseSlotId(slot.id);
      return parsed !== null && parsed.startMinute < bridgeEndMinute;
    })
    .map((slot, index) => ({
      ...slot,
      sortOrder: primarySlots.length + index,
    }));

  if (bridgeSlots.length === 0) {
    return { slots: primarySlots, bridgeDateIso: null, bridgeStartIndex: -1 };
  }

  return {
    slots: [...primarySlots, ...bridgeSlots],
    bridgeDateIso,
    bridgeStartIndex: primarySlots.length,
  };
}
