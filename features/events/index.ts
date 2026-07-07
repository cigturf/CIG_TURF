export type {
  AnyAppEvent,
  AppEventEnvelope,
  AppEventHandler,
  AppEventPayloadMap,
  AppEventSource,
  AppEventSubscription,
  BookingEventPayload,
  NotificationCreatedPayload,
  PaymentEventPayload,
  SlotEventPayload,
} from "@/features/events/types/event.types";

export {
  APP_EVENT_TYPES,
  BOOKING_EVENTS,
  DASHBOARD_REFRESH_EVENTS,
  SLOT_AVAILABILITY_EVENTS,
  type AppEventType,
} from "@/features/events/constants/event-types";

export {
  EventBus,
  createAppEventEnvelope,
  getEventBus,
  parseAppEvent,
  resetEventBusForTests,
  serializeAppEvent,
} from "@/features/events/lib/event-bus";

export { EventBusProvider, useEventBus } from "@/features/events/providers/event-bus-provider";
export { useAppEventSubscriber } from "@/features/events/hooks/use-app-event-subscriber";
export { useAppEventPublisher } from "@/features/events/hooks/use-app-event-publisher";
export { RealtimeEventBridge } from "@/features/events/bridge/realtime-event-bridge";
export { createServerAppEvent } from "@/features/events/lib/publish-server-event";
export {
  mapBookedSlotChangeToEvents,
  mapBookingChangeToEvents,
  mapBusinessSettingsChangeToEvents,
  mapPaymentChangeToEvents,
} from "@/features/events/bridge/map-realtime-to-events";
