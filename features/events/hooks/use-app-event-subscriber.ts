"use client";

import { useEffect, useRef } from "react";

import type { AppEventType } from "@/features/events/constants/event-types";
import { useEventBus } from "@/features/events/providers/event-bus-provider";
import type { AppEventEnvelope, AppEventHandler } from "@/features/events/types/event.types";

export function useAppEventSubscriber<T extends AppEventType>(
  types: T | T[] | "*",
  handler: AppEventHandler<T>,
  options: { enabled?: boolean } = {},
) {
  const bus = useEventBus();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (options.enabled === false) return;

    return bus.subscribe(types, (event) => {
      handlerRef.current(event as AppEventEnvelope<T>);
    });
  }, [bus, types, options.enabled]);
}
