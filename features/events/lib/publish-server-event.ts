import type { AppEventType } from "@/features/events/constants/event-types";
import type { AppEventPayloadMap } from "@/features/events/types/event.types";
import { createAppEventEnvelope } from "@/features/events/lib/event-bus";

/**
 * Server-side helper for future API routes, webhooks, and mobile backends.
 * Returns a serializable envelope — publish to SSE/WebSocket/push from the caller.
 */
export function createServerAppEvent<T extends AppEventType>(
  type: T,
  payload: AppEventPayloadMap[T],
): ReturnType<typeof createAppEventEnvelope<T>> {
  return createAppEventEnvelope(type, payload, "server");
}
