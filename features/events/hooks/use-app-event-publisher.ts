"use client";

import { useCallback } from "react";

import type { AppEventType } from "@/features/events/constants/event-types";
import { useEventBus } from "@/features/events/providers/event-bus-provider";
import type {
  AppEventEnvelope,
  AppEventPayloadMap,
  AppEventSource,
} from "@/features/events/types/event.types";

export function useAppEventPublisher() {
  const bus = useEventBus();

  return useCallback(
    <T extends AppEventType>(
      type: T,
      payload: AppEventPayloadMap[T],
      source: AppEventSource = "client",
    ): AppEventEnvelope<T> => {
      return bus.publish(type, payload, source);
    },
    [bus],
  );
}
