import type { AppEventType } from "@/features/events/constants/event-types";
import { APP_EVENT_TYPES } from "@/features/events/constants/event-types";
import type { AppEventEnvelope } from "@/features/events/types/event.types";
import type { AuditActor, AuditLogRecord } from "@/features/audit/types/audit.types";
import { randomUUID } from "crypto";

type AuditDraft = Omit<AuditLogRecord, "id" | "eventId" | "createdAt">;

function bookingPayload(event: AppEventEnvelope) {
  const payload = event.payload as Record<string, unknown>;
  return {
    bookingId: payload.bookingId ? String(payload.bookingId) : null,
    bookingReference: payload.bookingReference ? String(payload.bookingReference) : null,
    customerName: payload.customerName ? String(payload.customerName) : null,
    status: payload.status ? String(payload.status) : null,
    source: payload.source ? String(payload.source) : null,
    collectedAmount: payload.collectedAmount ? Number(payload.collectedAmount) : null,
    method: payload.method ? String(payload.method) : null,
  };
}

function baseDraft(
  event: AppEventEnvelope,
  input: Omit<AuditDraft, "performedBy" | "performedById" | "ipAddress" | "browser">,
  actor?: AuditActor,
): AuditDraft {
  return {
    ...input,
    performedBy: actor?.email ?? null,
    performedById: actor?.id ?? null,
    ipAddress: null,
    browser: null,
  };
}

export function mapAppEventToAuditRecord(
  event: AppEventEnvelope,
  actor?: AuditActor,
): AuditDraft | null {
  const booking = bookingPayload(event);

  switch (event.type as AppEventType) {
    case APP_EVENT_TYPES.BOOKING_CREATED:
      return baseDraft(event, {
        action: "Booking Created",
        category: "bookings",
        module: "Bookings",
        entityId: booking.bookingId,
        bookingId: booking.bookingId,
        customerName: booking.customerName,
        description: `Online booking ${booking.bookingReference ?? ""} created for ${booking.customerName ?? "customer"}`.trim(),
        oldValue: null,
        newValue: booking.status,
        metadata: { event: event.payload },
      }, actor);
    case APP_EVENT_TYPES.BOOKING_MANUAL_CREATED:
      return baseDraft(event, {
        action: "Manual Booking Created",
        category: "bookings",
        module: "Bookings",
        entityId: booking.bookingId,
        bookingId: booking.bookingId,
        customerName: booking.customerName,
        description: `Manual booking ${booking.bookingReference ?? ""} created for ${booking.customerName ?? "customer"}`.trim(),
        oldValue: null,
        newValue: "manual",
        metadata: { event: event.payload },
      }, actor);
    case APP_EVENT_TYPES.BOOKING_UPDATED:
      return baseDraft(event, {
        action: "Booking Updated",
        category: "bookings",
        module: "Bookings",
        entityId: booking.bookingId,
        bookingId: booking.bookingId,
        customerName: booking.customerName,
        description: `Booking ${booking.bookingReference ?? booking.bookingId ?? ""} updated`,
        oldValue: null,
        newValue: booking.status,
        metadata: { event: event.payload },
      }, actor);
    case APP_EVENT_TYPES.BOOKING_CANCELLED:
      return baseDraft(event, {
        action: "Booking Cancelled",
        category: "bookings",
        module: "Bookings",
        entityId: booking.bookingId,
        bookingId: booking.bookingId,
        customerName: booking.customerName,
        description: `Booking ${booking.bookingReference ?? ""} cancelled`,
        oldValue: booking.status ?? "active",
        newValue: "cancelled",
        metadata: { event: event.payload },
      }, actor);
    case APP_EVENT_TYPES.BOOKING_COMPLETED:
      return baseDraft(event, {
        action: "Booking Completed",
        category: "bookings",
        module: "Bookings",
        entityId: booking.bookingId,
        bookingId: booking.bookingId,
        customerName: booking.customerName,
        description: `Booking ${booking.bookingReference ?? ""} marked completed`,
        oldValue: "in_progress",
        newValue: "completed",
        metadata: { event: event.payload },
      }, actor);
    case APP_EVENT_TYPES.BOOKING_PAYMENT_COLLECTED:
    case APP_EVENT_TYPES.PAYMENT_COLLECTED:
      return baseDraft(event, {
        action: "Remaining Payment Collected",
        category: "payments",
        module: "Finance",
        entityId: booking.bookingId,
        bookingId: booking.bookingId,
        customerName: booking.customerName,
        description: `₹${booking.collectedAmount ?? 0} collected via ${booking.method ?? "offline"}`,
        oldValue: null,
        newValue: String(booking.collectedAmount ?? ""),
        metadata: { event: event.payload },
      }, actor);
    case APP_EVENT_TYPES.PAYMENT_PARTIAL:
      return baseDraft(event, {
        action: "Partial Payment Collected",
        category: "payments",
        module: "Finance",
        entityId: booking.bookingId,
        bookingId: booking.bookingId,
        customerName: booking.customerName,
        description: `Partial payment collected`,
        oldValue: null,
        newValue: String(booking.collectedAmount ?? ""),
        metadata: { event: event.payload },
      }, actor);
    case APP_EVENT_TYPES.PAYMENT_COMPLETED:
      return baseDraft(event, {
        action: "Online Payment Completed",
        category: "payments",
        module: "Payments",
        entityId: (event.payload as { paymentId?: string }).paymentId ?? null,
        bookingId: booking.bookingId,
        customerName: booking.customerName,
        description: "Razorpay payment completed",
        oldValue: null,
        newValue: "paid",
        metadata: { event: event.payload },
      }, actor);
    case APP_EVENT_TYPES.SLOT_BLOCKED:
      return baseDraft(event, {
        action: "Slot Blocked",
        category: "slots",
        module: "Slots",
        entityId: (event.payload as { slotId?: string }).slotId ?? null,
        bookingId: null,
        customerName: null,
        description: `Slot blocked on ${(event.payload as { bookingDate?: string }).bookingDate ?? "date"}`,
        oldValue: "available",
        newValue: "blocked",
        metadata: { event: event.payload },
      }, actor);
    case APP_EVENT_TYPES.SLOT_UNBLOCKED:
      return baseDraft(event, {
        action: "Slot Unblocked",
        category: "slots",
        module: "Slots",
        entityId: (event.payload as { slotId?: string }).slotId ?? null,
        bookingId: null,
        customerName: null,
        description: `Slot unblocked on ${(event.payload as { bookingDate?: string }).bookingDate ?? "date"}`,
        oldValue: "blocked",
        newValue: "available",
        metadata: { event: event.payload },
      }, actor);
    case APP_EVENT_TYPES.SLOT_MAINTENANCE:
      return baseDraft(event, {
        action: "Maintenance Applied",
        category: "slots",
        module: "Slots",
        entityId: (event.payload as { slotId?: string }).slotId ?? null,
        bookingId: null,
        customerName: null,
        description: "Maintenance block applied to slot",
        oldValue: "available",
        newValue: "maintenance",
        metadata: { event: event.payload },
      }, actor);
    case APP_EVENT_TYPES.SLOT_HOLIDAY: {
      const active = (event.payload as { active?: boolean }).active;
      return baseDraft(event, {
        action: active ? "Holiday Applied" : "Holiday Removed",
        category: "slots",
        module: "Slots",
        entityId: (event.payload as { bookingDate?: string }).bookingDate ?? null,
        bookingId: null,
        customerName: null,
        description: active ? "Holiday applied to date" : "Holiday removed from date",
        oldValue: active ? "open" : "holiday",
        newValue: active ? "holiday" : "open",
        metadata: { event: event.payload },
      }, actor);
    }
    case APP_EVENT_TYPES.PRICING_CREATED:
      return baseDraft(event, {
        action: "Rule Created",
        category: "pricing",
        module: "Pricing",
        entityId: (event.payload as { ruleId?: string }).ruleId ?? null,
        bookingId: null,
        customerName: null,
        description: "Pricing rule created",
        oldValue: null,
        newValue: "created",
        metadata: { event: event.payload },
      }, actor);
    case APP_EVENT_TYPES.PRICING_UPDATED:
      return baseDraft(event, {
        action: "Rule Updated",
        category: "pricing",
        module: "Pricing",
        entityId: (event.payload as { ruleId?: string }).ruleId ?? null,
        bookingId: null,
        customerName: null,
        description: "Pricing rule updated",
        oldValue: null,
        newValue: "updated",
        metadata: { event: event.payload },
      }, actor);
    case APP_EVENT_TYPES.PRICING_DELETED:
      return baseDraft(event, {
        action: "Rule Deleted",
        category: "pricing",
        module: "Pricing",
        entityId: (event.payload as { ruleId?: string }).ruleId ?? null,
        bookingId: null,
        customerName: null,
        description: "Pricing rule deleted",
        oldValue: "active",
        newValue: "deleted",
        metadata: { event: event.payload },
      }, actor);
    case APP_EVENT_TYPES.BRANDING_UPDATED:
      return baseDraft(event, {
        action: "Logo Changed",
        category: "business_settings",
        module: "Business Settings",
        entityId: "default",
        bookingId: null,
        customerName: null,
        description: "Branding or logo updated",
        oldValue: null,
        newValue: "updated",
        metadata: { event: event.payload },
      }, actor);
    case APP_EVENT_TYPES.CONTACT_UPDATED:
      return baseDraft(event, {
        action: "Contact Updated",
        category: "business_settings",
        module: "Business Settings",
        entityId: "default",
        bookingId: null,
        customerName: null,
        description: "Business contact details updated",
        oldValue: null,
        newValue: "updated",
        metadata: { event: event.payload },
      }, actor);
    case APP_EVENT_TYPES.BOOKING_SETTINGS_UPDATED:
      return baseDraft(event, {
        action: "Booking Window Changed",
        category: "business_settings",
        module: "Business Settings",
        entityId: "default",
        bookingId: null,
        customerName: null,
        description: "Booking settings or advance amount updated",
        oldValue: null,
        newValue: "updated",
        metadata: { event: event.payload },
      }, actor);
    case APP_EVENT_TYPES.BUSINESS_UPDATED:
      return baseDraft(event, {
        action: "Business Name Updated",
        category: "business_settings",
        module: "Business Settings",
        entityId: "default",
        bookingId: null,
        customerName: null,
        description: "Business configuration updated",
        oldValue: null,
        newValue: "updated",
        metadata: { event: event.payload },
      }, actor);
    case APP_EVENT_TYPES.MEDIA_UPLOADED: {
      const category = (event.payload as { category?: string }).category;
      return baseDraft(event, {
        action: category === "hero" ? "Hero Image Changed" : "Image Uploaded",
        category: "media",
        module: "Media",
        entityId: (event.payload as { assetId?: string }).assetId ?? null,
        bookingId: null,
        customerName: null,
        description: category === "hero" ? "Hero image updated" : "Media asset uploaded",
        oldValue: null,
        newValue: "uploaded",
        metadata: { event: event.payload },
      }, actor);
    }
    case APP_EVENT_TYPES.MEDIA_DELETED:
      return baseDraft(event, {
        action: "Image Deleted",
        category: "media",
        module: "Media",
        entityId: (event.payload as { assetId?: string }).assetId ?? null,
        bookingId: null,
        customerName: null,
        description: "Media asset deleted",
        oldValue: "active",
        newValue: "deleted",
        metadata: { event: event.payload },
      }, actor);
    case APP_EVENT_TYPES.MEDIA_REORDERED:
      return baseDraft(event, {
        action: "Gallery Reordered",
        category: "media",
        module: "Media",
        entityId: (event.payload as { assetId?: string }).assetId ?? null,
        bookingId: null,
        customerName: null,
        description: "Gallery order updated",
        oldValue: null,
        newValue: "reordered",
        metadata: { event: event.payload },
      }, actor);
    case APP_EVENT_TYPES.PROMOTION_CREATED:
      return baseDraft(event, {
        action: "Promotion Created",
        category: "promotions",
        module: "Promotions",
        entityId: (event.payload as { promotionId?: string }).promotionId ?? null,
        bookingId: null,
        customerName: null,
        description: `Promotion created: ${(event.payload as { title?: string }).title ?? ""}`.trim(),
        oldValue: null,
        newValue: "draft",
        metadata: { event: event.payload },
      }, actor);
    case APP_EVENT_TYPES.PROMOTION_UPDATED:
      return baseDraft(event, {
        action: "Promotion Updated",
        category: "promotions",
        module: "Promotions",
        entityId: (event.payload as { promotionId?: string }).promotionId ?? null,
        bookingId: null,
        customerName: null,
        description: `Promotion updated: ${(event.payload as { title?: string }).title ?? ""}`.trim(),
        oldValue: null,
        newValue: (event.payload as { status?: string }).status ?? "updated",
        metadata: { event: event.payload },
      }, actor);
    case APP_EVENT_TYPES.PROMOTION_PUBLISHED:
      return baseDraft(event, {
        action: "Promotion Published",
        category: "promotions",
        module: "Promotions",
        entityId: (event.payload as { promotionId?: string }).promotionId ?? null,
        bookingId: null,
        customerName: null,
        description: "Promotion published",
        oldValue: "draft",
        newValue: "published",
        metadata: { event: event.payload },
      }, actor);
    case APP_EVENT_TYPES.PROMOTION_EXPIRED:
      return baseDraft(event, {
        action: "Promotion Expired",
        category: "promotions",
        module: "Promotions",
        entityId: (event.payload as { promotionId?: string }).promotionId ?? null,
        bookingId: null,
        customerName: null,
        description: "Promotion expired",
        oldValue: "published",
        newValue: "expired",
        metadata: { event: event.payload },
      }, actor);
    case APP_EVENT_TYPES.AUTH_LOGIN_SUCCESS:
      return baseDraft(event, {
        action: "Owner Login",
        category: "authentication",
        module: "Authentication",
        entityId: (event.payload as { userId?: string }).userId ?? null,
        bookingId: null,
        customerName: null,
        description: "Successful admin login",
        oldValue: null,
        newValue: "authenticated",
        metadata: { event: event.payload },
      }, actor);
    case APP_EVENT_TYPES.AUTH_LOGOUT:
      return baseDraft(event, {
        action: "Owner Logout",
        category: "authentication",
        module: "Authentication",
        entityId: (event.payload as { userId?: string }).userId ?? null,
        bookingId: null,
        customerName: null,
        description: "Admin signed out",
        oldValue: "authenticated",
        newValue: "signed_out",
        metadata: { event: event.payload },
      }, actor);
    case APP_EVENT_TYPES.AUTH_LOGIN_FAILED:
      return baseDraft(event, {
        action: "Failed Login Attempt",
        category: "authentication",
        module: "Authentication",
        entityId: (event.payload as { email?: string }).email ?? null,
        bookingId: null,
        customerName: null,
        description: "Failed login attempt",
        oldValue: null,
        newValue: "failed",
        metadata: { event: event.payload },
      }, actor);
    case APP_EVENT_TYPES.AUTH_PASSWORD_RESET:
      return baseDraft(event, {
        action: "Password Reset",
        category: "authentication",
        module: "Authentication",
        entityId: (event.payload as { email?: string }).email ?? null,
        bookingId: null,
        customerName: null,
        description: "Password reset requested or completed",
        oldValue: null,
        newValue: "reset",
        metadata: { event: event.payload },
      }, actor);
    default:
      return null;
  }
}

export function createAuditRecordFromEvent(
  event: AppEventEnvelope,
  actor?: AuditActor,
): AuditLogRecord | null {
  const draft = mapAppEventToAuditRecord(event, actor);
  if (!draft) return null;

  return {
    id: randomUUID(),
    eventId: event.id,
    createdAt: event.timestamp,
    ...draft,
  };
}
