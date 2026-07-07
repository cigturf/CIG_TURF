"use client";

import { useCallback } from "react";

import { useAppEventPublisher } from "@/features/events/hooks/use-app-event-publisher";
import { usePostgresChanges } from "@/features/realtime/hooks/use-postgres-changes";
import { useRealtimeContext } from "@/features/realtime/providers/realtime-provider";
import {
  mapBookedSlotChangeToEvents,
  mapBookingChangeToEvents,
  mapBookingPaymentRecordChangeToEvents,
  mapBusinessSettingsChangeToEvents,
  mapMediaAssetChangeToEvents,
  mapPromotionChangeToEvents,
  mapPricingRuleChangeToEvents,
  mapPaymentChangeToEvents,
  mapSlotBlockChangeToEvents,
  mapSlotHolidayChangeToEvents,
} from "@/features/events/bridge/map-realtime-to-events";
import type { RealtimeChangePayload } from "@/features/realtime/types/realtime.types";

/**
 * Single bridge from Supabase Realtime → Application Event Bus.
 * No other module should subscribe to postgres_changes directly.
 */
export function RealtimeEventBridge({ children }: { children: React.ReactNode }) {
  const publish = useAppEventPublisher();
  const { scope } = useRealtimeContext();

  const publishMappedEvents = useCallback(
    (mapper: (payload: RealtimeChangePayload) => ReturnType<typeof mapBookedSlotChangeToEvents>) =>
      (payload: RealtimeChangePayload) => {
        for (const event of mapper(payload)) {
          publish(event.type, event.payload as never, "bridge");
        }
      },
    [publish],
  );

  usePostgresChanges({
    table: "booked_slots",
    onChange: publishMappedEvents(mapBookedSlotChangeToEvents),
  });

  usePostgresChanges({
    table: "slot_blocks",
    onChange: publishMappedEvents(mapSlotBlockChangeToEvents),
  });

  usePostgresChanges({
    table: "slot_holidays",
    onChange: publishMappedEvents(mapSlotHolidayChangeToEvents),
  });

  usePostgresChanges({
    table: "pricing_rules",
    onChange: publishMappedEvents(mapPricingRuleChangeToEvents),
  });

  usePostgresChanges({
    table: "bookings",
    onChange: publishMappedEvents(mapBookingChangeToEvents),
  });

  usePostgresChanges({
    table: "booking_payment_records",
    enabled: scope === "admin",
    onChange: publishMappedEvents(mapBookingPaymentRecordChangeToEvents),
  });

  usePostgresChanges({
    table: "payments",
    enabled: scope === "admin",
    onChange: publishMappedEvents(mapPaymentChangeToEvents),
  });

  usePostgresChanges({
    table: "business_settings",
    filter: "id=eq.default",
    onChange: () => {
      for (const event of mapBusinessSettingsChangeToEvents()) {
        publish(event.type, event.payload as never, "bridge");
      }
    },
  });

  usePostgresChanges({
    table: "media_assets",
    onChange: publishMappedEvents(mapMediaAssetChangeToEvents),
  });

  usePostgresChanges({
    table: "promotional_content",
    onChange: publishMappedEvents(mapPromotionChangeToEvents),
  });

  return children;
}
