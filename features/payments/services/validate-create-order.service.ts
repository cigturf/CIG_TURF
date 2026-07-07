import type { CreateOrderInput } from "@/features/payments/schemas/create-order.schema";
import { resolveBookingEngineConfig } from "@/features/booking/services/booking-config.service";
import { buildBookingViewSlots } from "@/features/booking/services/booking-view-slots.service";
import { calculateBookingSummary } from "@/features/booking/utils/booking-summary";
import { areConsecutiveSlotIds, getBridgeDateIso } from "@/features/booking/utils/slot-timeline";
import { listActivePricingRules } from "@/features/pricing/services/pricing.repository";
import { buildPricingSnapshot } from "@/features/pricing/services/pricing-engine.service";
import { getAvailabilityForDate } from "@/features/slots/services/slot-management.service";
import { SettingsService } from "@/server/settings/settings.service";

export type CreateOrderValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export async function validateCreateOrderInput(
  input: CreateOrderInput,
): Promise<CreateOrderValidationResult> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dateIso)) {
    return { ok: false, error: "Invalid booking date" };
  }

  const publicSettings = await SettingsService.getPublic();
  if (!publicSettings) {
    return { ok: false, error: "Booking is temporarily unavailable" };
  }

  const config = resolveBookingEngineConfig(publicSettings);
  const bridgeDateIso = getBridgeDateIso(input.dateIso);
  const [primaryAvailability, bridgeAvailability, pricingRules] = await Promise.all([
    getAvailabilityForDate(input.dateIso),
    getAvailabilityForDate(bridgeDateIso),
    listActivePricingRules(),
  ]);
  const pricingSnapshot = buildPricingSnapshot(pricingRules);

  const { slots } = buildBookingViewSlots({
    dateIso: input.dateIso,
    config,
    selectedSlotIds: input.selectedSlotIds,
    primaryAvailability: {
      bookedSlotIds: primaryAvailability.bookedSlotIds,
      blockedSlotIds: primaryAvailability.blockedSlotIds,
      maintenanceSlotIds: primaryAvailability.maintenanceSlotIds,
      isHoliday: primaryAvailability.isHoliday,
    },
    bridgeAvailability: {
      bookedSlotIds: bridgeAvailability.bookedSlotIds,
      blockedSlotIds: bridgeAvailability.blockedSlotIds,
      maintenanceSlotIds: bridgeAvailability.maintenanceSlotIds,
      isHoliday: bridgeAvailability.isHoliday,
    },
    pricing: pricingSnapshot,
  });

  const selected = slots.filter((slot) => input.selectedSlotIds.includes(slot.id));
  if (selected.length !== input.selectedSlotIds.length) {
    return { ok: false, error: "One or more selected slots are invalid" };
  }

  if (selected.some((slot) => !slot.isSelectable)) {
    return { ok: false, error: "One or more selected slots are unavailable" };
  }

  if (!areConsecutiveSlotIds(input.selectedSlotIds, config.slotDurationMinutes)) {
    return { ok: false, error: "Selected slots must be consecutive" };
  }

  const summary = calculateBookingSummary(slots, input.selectedSlotIds, config);
  const maxDuration = config.maxConsecutiveDurationMinutes;
  if (summary.totalDurationMinutes > maxDuration) {
    return { ok: false, error: "Selected duration exceeds the maximum allowed" };
  }

  if (summary.slotCount !== input.slotCount) {
    return { ok: false, error: "Invalid slot count" };
  }

  if (summary.totalDurationMinutes !== input.totalDurationMinutes) {
    return { ok: false, error: "Invalid booking duration" };
  }

  if (summary.totalPrice !== input.totalPrice) {
    return { ok: false, error: "Booking price mismatch. Please refresh and try again." };
  }

  if (summary.advanceAmount !== input.advanceAmount) {
    return { ok: false, error: "Invalid advance amount" };
  }

  if (summary.remainingAmount !== input.remainingAmount) {
    return { ok: false, error: "Invalid remaining amount" };
  }

  return { ok: true };
}
