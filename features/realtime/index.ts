export type {
  RealtimeChangePayload,
  RealtimeConnectionStatus,
  RealtimeScope,
  RealtimeSubscribeOptions,
  RealtimeTable,
} from "@/features/realtime/types/realtime.types";

export { REALTIME_ACTIVE_TABLES, REALTIME_FUTURE_TABLES } from "@/features/realtime/constants/realtime-tables";
export { RealtimeSubscriptionManager, buildSubscriptionKey } from "@/features/realtime/lib/subscription-manager";

export { RealtimeProvider, useRealtimeContext } from "@/features/realtime/providers/realtime-provider";
export { SlotRealtimeProvider, useRealtimeSlots } from "@/features/realtime/providers/slot-realtime-provider";
export {
  BookingRealtimeProvider,
  useRealtimeBookings,
} from "@/features/realtime/providers/booking-realtime-provider";
export {
  BusinessSettingsRealtimeProvider,
  useRealtimeBusinessSettings,
} from "@/features/realtime/providers/business-settings-realtime-provider";
export {
  NotificationRealtimeProvider,
  useRealtimeNotifications,
} from "@/features/realtime/providers/notification-realtime-provider";
export {
  DashboardRealtimeProvider,
  useRealtimeDashboard,
} from "@/features/realtime/providers/dashboard-realtime-provider";
export {
  PublicRealtimeProviders,
  AdminRealtimeProviders,
} from "@/features/realtime/providers/realtime-providers";

export { usePostgresChanges } from "@/features/realtime/hooks/use-postgres-changes";
export { useRealtimeConnection } from "@/features/realtime/hooks/use-realtime-connection";
export { RealtimeStatusIndicator } from "@/features/realtime/components/realtime-status-indicator";
export {
  RealtimeSearchProvider,
  useRealtimeSearchIndex,
} from "@/features/realtime/search/realtime-search-provider";

export {
  APP_EVENT_TYPES,
  EventBusProvider,
  RealtimeEventBridge,
  useAppEventPublisher,
  useAppEventSubscriber,
  useEventBus,
} from "@/features/events";
