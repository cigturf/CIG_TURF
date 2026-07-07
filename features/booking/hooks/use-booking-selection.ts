"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  buildBookingDateOptions,
  resolveBookingEngineConfig,
} from "@/features/booking/services";
import { buildBookingViewSlots } from "@/features/booking/services/booking-view-slots.service";
import type { BookingSelectionState } from "@/features/booking/types";
import {
  BOOKING_MESSAGES,
  bookingSessionToSelection,
  calculateBookingSummary,
  readBookingSession,
  saveBookingSession,
  toggleConsecutiveSlot,
} from "@/features/booking/utils";
import { getBridgeDateIso } from "@/features/booking/utils/slot-timeline";
import { useRealtimeSlots } from "@/features/realtime/hooks/use-realtime-slots";
import { useRealtimePricing } from "@/features/pricing/hooks/use-realtime-pricing";
import { useConfigContext } from "@/components/providers/config-provider";
import { formatDate } from "@/utils/format";

const INITIAL_SELECTION: BookingSelectionState = {
  dateIso: null,
  selectedSlotIds: [],
};

function getInitialSelection(): BookingSelectionState {
  const session = readBookingSession();
  if (!session) return INITIAL_SELECTION;
  return bookingSessionToSelection(session);
}

export function useBookingSelection() {
  const { publicSettings } = useConfigContext();
  const config = useMemo(() => resolveBookingEngineConfig(publicSettings), [publicSettings]);

  const dateOptions = useMemo(
    () => buildBookingDateOptions(config.bookingWindowDays),
    [config.bookingWindowDays],
  );

  const [selection, setSelection] = useState<BookingSelectionState>(INITIAL_SELECTION);
  const [hydrated, setHydrated] = useState(false);

  const bridgeDateIso = selection.dateIso ? getBridgeDateIso(selection.dateIso) : null;

  const primaryRealtime = useRealtimeSlots(selection.dateIso);
  const bridgeRealtime = useRealtimeSlots(bridgeDateIso);
  const { snapshot: pricingSnapshot, hydrated: pricingHydrated } = useRealtimePricing();

  useEffect(() => {
    setSelection(getInitialSelection());
    setHydrated(true);
  }, []);

  const slotView = useMemo(() => {
    if (!selection.dateIso) {
      return { slots: [], bridgeDateIso: null, bridgeStartIndex: -1 };
    }

    return buildBookingViewSlots({
      dateIso: selection.dateIso,
      config,
      selectedSlotIds: selection.selectedSlotIds,
      primaryAvailability: {
        bookedSlotIds: primaryRealtime.bookedSlotIds,
        blockedSlotIds: primaryRealtime.blockedSlotIds,
        maintenanceSlotIds: primaryRealtime.maintenanceSlotIds,
        isHoliday: primaryRealtime.isHoliday,
      },
      bridgeAvailability: {
        bookedSlotIds: bridgeRealtime.bookedSlotIds,
        blockedSlotIds: bridgeRealtime.blockedSlotIds,
        maintenanceSlotIds: bridgeRealtime.maintenanceSlotIds,
        isHoliday: bridgeRealtime.isHoliday,
      },
      pricing: pricingSnapshot,
    });
  }, [
    selection.dateIso,
    selection.selectedSlotIds,
    config,
    primaryRealtime.bookedSlotIds,
    primaryRealtime.blockedSlotIds,
    primaryRealtime.maintenanceSlotIds,
    primaryRealtime.isHoliday,
    bridgeRealtime.bookedSlotIds,
    bridgeRealtime.blockedSlotIds,
    bridgeRealtime.maintenanceSlotIds,
    bridgeRealtime.isHoliday,
    pricingSnapshot,
  ]);

  const summary = useMemo(
    () => calculateBookingSummary(slotView.slots, selection.selectedSlotIds, config),
    [slotView.slots, selection.selectedSlotIds, config],
  );

  const bridgeDateLabel = useMemo(() => {
    if (!slotView.bridgeDateIso) return null;
    return formatDate(slotView.bridgeDateIso);
  }, [slotView.bridgeDateIso]);

  useEffect(() => {
    if (!hydrated) return;
    if (selection.dateIso && summary.slotCount > 0) {
      saveBookingSession(selection, summary);
    }
  }, [hydrated, selection, summary]);

  const selectDate = useCallback((dateIso: string) => {
    setSelection({ dateIso, selectedSlotIds: [] });
  }, []);

  const toggleSlot = useCallback(
    (slotId: string) => {
      setSelection((prev) => {
        const result = toggleConsecutiveSlot(
          slotView.slots,
          prev.selectedSlotIds,
          slotId,
          config,
        );

        if (result.rejected) {
          const message =
            result.rejectionReason === "past"
              ? BOOKING_MESSAGES.pastSlot
              : result.rejectionReason === "max_duration"
                ? BOOKING_MESSAGES.maxDuration
                : result.rejectionReason === "not_selectable"
                  ? BOOKING_MESSAGES.notSelectable
                  : BOOKING_MESSAGES.nonConsecutive;

          toast.message(message);
        }

        return { ...prev, selectedSlotIds: result.selectedSlotIds };
      });
    },
    [slotView.slots, config],
  );

  const canContinue =
    selection.dateIso !== null &&
    summary.slotCount > 0 &&
    summary.totalDurationMinutes >= config.minBookingDurationMinutes;

  return {
    config,
    dateOptions,
    slots: slotView.slots,
    bridgeStartIndex: slotView.bridgeStartIndex,
    bridgeDateLabel,
    selection,
    selectDate,
    toggleSlot,
    summary,
    canContinue,
    hydrated: hydrated && primaryRealtime.hydrated && bridgeRealtime.hydrated,
    pricingHydrated,
  };
}
