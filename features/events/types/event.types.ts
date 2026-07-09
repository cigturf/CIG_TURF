import type { AppEventType } from "@/features/events/constants/event-types";

export type AppEventSource = "realtime" | "server" | "client" | "bridge";

/** Serializable envelope — safe for logging, SSE, and future mobile clients. */
export type AppEventEnvelope<T extends AppEventType = AppEventType> = {
  id: string;
  type: T;
  payload: AppEventPayloadMap[T];
  timestamp: string;
  source: AppEventSource;
  version: 1;
};

export type BookingEventPayload = {
  bookingId: string;
  bookingReference?: string;
  bookingDate?: string;
  customerName?: string;
  userId?: string;
  status?: string;
  source?: string;
  remainingAmount?: number;
  collectedAmount?: number;
  selectedSlots?: string[];
};

export type BookingPaymentCollectedPayload = BookingEventPayload & {
  collectedAmount: number;
  method?: string;
  referenceNumber?: string | null;
};

export type SlotEventPayload = {
  slotId: string;
  bookingDate: string;
  bookingId?: string;
  source?: "booked" | "hold";
};

export type SlotAvailabilityRefreshPayload = {
  bookingDate?: string;
  slotId?: string;
};

export type SlotHolidayPayload = {
  bookingDate: string;
  active: boolean;
  label?: string;
};

export type SlotPriceEventPayload = {
  dateIso?: string;
  slotId?: string;
  price?: number;
};

export type BusinessUpdatedPayload = {
  settingsId: string;
};

export type SettingsSectionUpdatedPayload = {
  settingsId: string;
  section: "branding" | "contact" | "booking";
};

export type MediaAssetChangedPayload = {
  assetId: string;
  category?: string;
  visibility?: string;
};

export type PromotionEventPayload = {
  promotionId: string;
  title?: string;
  status?: string;
  contentType?: string;
};

export type AnnouncementUpdatedPayload = {
  promotionId?: string;
  enabled?: boolean;
};

export type GalleryUpdatedPayload = {
  galleryId?: string;
};

export type PlatformEventPayload = {
  eventId: string;
  title?: string;
};

export type PaymentEventPayload = {
  paymentId: string;
  bookingSessionId?: string;
  bookingId?: string;
  amount?: number;
  status?: string;
  method?: string;
  referenceNumber?: string | null;
  customerEmail?: string | null;
  reason?: string;
};

export type PricingEventPayload = {
  ruleId: string;
  groupId?: string;
  active?: boolean;
  type?: string;
};

export type NotificationCreatedPayload = {
  notificationId: string;
  title: string;
  message: string;
  type: string;
};

export type CustomerNoteUpdatedPayload = {
  customerKey: string;
};

export type AuthEventPayload = {
  userId?: string;
  email?: string;
  role?: string;
};

export type AuditLogRecordedPayload = {
  logId: string;
};

export type EmailLogEventPayload = {
  emailLogId: string;
  recipient: string;
  template: string;
  status: string;
};

export type AppEventPayloadMap = {
  "booking.created": BookingEventPayload;
  "booking.updated": BookingEventPayload;
  "booking.cancelled": BookingEventPayload;
  "booking.completed": BookingEventPayload;
  "booking.arrived": BookingEventPayload;
  "booking.started": BookingEventPayload;
  "booking.payment.collected": BookingPaymentCollectedPayload;
  "payment.collected": BookingPaymentCollectedPayload;
  "payment.partial": BookingPaymentCollectedPayload;
  "booking.manual.created": BookingEventPayload;
  "slot.booked": SlotEventPayload;
  "slot.released": SlotEventPayload;
  "slot.blocked": SlotEventPayload;
  "slot.unblocked": SlotEventPayload;
  "slot.maintenance": SlotEventPayload;
  "slot.holiday": SlotHolidayPayload;
  "slot.availability.refresh": SlotAvailabilityRefreshPayload;
  "slot.price.updated": SlotPriceEventPayload;
  "pricing.created": PricingEventPayload;
  "pricing.updated": PricingEventPayload;
  "pricing.deleted": PricingEventPayload;
  "pricing.activated": PricingEventPayload;
  "pricing.deactivated": PricingEventPayload;
  "gallery.updated": GalleryUpdatedPayload;
  "business.updated": BusinessUpdatedPayload;
  "branding.updated": SettingsSectionUpdatedPayload;
  "contact.updated": SettingsSectionUpdatedPayload;
  "booking.settings.updated": SettingsSectionUpdatedPayload;
  "media.uploaded": MediaAssetChangedPayload;
  "media.updated": MediaAssetChangedPayload;
  "media.deleted": MediaAssetChangedPayload;
  "media.restored": MediaAssetChangedPayload;
  "media.reordered": MediaAssetChangedPayload;
  "promotion.created": PromotionEventPayload;
  "promotion.updated": PromotionEventPayload;
  "promotion.deleted": PromotionEventPayload;
  "promotion.published": PromotionEventPayload;
  "promotion.expired": PromotionEventPayload;
  "announcement.updated": AnnouncementUpdatedPayload;
  "event.created": PlatformEventPayload;
  "event.deleted": PlatformEventPayload;
  "payment.completed": PaymentEventPayload;
  "payment.failed": PaymentEventPayload;
  "notification.created": NotificationCreatedPayload;
  "customer.note.updated": CustomerNoteUpdatedPayload;
  "auth.login.success": AuthEventPayload;
  "auth.logout": AuthEventPayload;
  "auth.login.failed": AuthEventPayload;
  "auth.password.reset": AuthEventPayload;
  "audit.log.recorded": AuditLogRecordedPayload;
  "email.sent": EmailLogEventPayload;
  "email.failed": EmailLogEventPayload;
};

export type AppEventHandler<T extends AppEventType = AppEventType> = (
  event: AppEventEnvelope<T>,
) => void;

export type AnyAppEvent = {
  [K in AppEventType]: AppEventEnvelope<K>;
}[AppEventType];

export type AppEventSubscription = {
  id: string;
  types: AppEventType[] | "*";
  handler: AppEventHandler;
};
