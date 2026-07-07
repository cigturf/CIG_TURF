import { APP_EVENT_TYPES } from "@/features/events/constants/event-types";
import type { AppEventType } from "@/features/events/constants/event-types";
import type { AppEventEnvelope } from "@/features/events/types/event.types";
import {
  parseBookingPayload,
  parseBookedSlotPayload,
  parseMediaAssetPayload,
  parsePricingRulePayload,
  parsePromotionPayload,
  parseSlotBlockPayload,
  parseSlotHolidayPayload,
} from "@/features/realtime/utils/realtime-payload";
import type { RealtimeChangePayload } from "@/features/realtime/types/realtime.types";

export type MappedAppEvent = {
  type: AppEventType;
  payload: AppEventEnvelope["payload"];
};

export function mapBookedSlotChangeToEvents(payload: RealtimeChangePayload): MappedAppEvent[] {
  const event = parseBookedSlotPayload(payload);
  if (!event) return [];

  if (event.type === "insert") {
    return [
      {
        type: APP_EVENT_TYPES.SLOT_BOOKED,
        payload: {
          slotId: event.slotId,
          bookingDate: event.bookingDate,
        },
      },
    ];
  }

  return [
    {
      type: APP_EVENT_TYPES.SLOT_RELEASED,
      payload: {
        slotId: event.slotId,
        bookingDate: event.bookingDate,
      },
    },
  ];
}

export function mapSlotBlockChangeToEvents(payload: RealtimeChangePayload): MappedAppEvent[] {
  const event = parseSlotBlockPayload(payload);
  if (!event) return [];

  if (event.type === "delete") {
    return [
      {
        type: APP_EVENT_TYPES.SLOT_UNBLOCKED,
        payload: { slotId: event.slotId, bookingDate: event.bookingDate },
      },
    ];
  }

  if (event.state === "maintenance") {
    return [
      {
        type: APP_EVENT_TYPES.SLOT_MAINTENANCE,
        payload: { slotId: event.slotId, bookingDate: event.bookingDate },
      },
    ];
  }

  return [
    {
      type: APP_EVENT_TYPES.SLOT_BLOCKED,
      payload: { slotId: event.slotId, bookingDate: event.bookingDate },
    },
  ];
}

export function mapSlotHolidayChangeToEvents(payload: RealtimeChangePayload): MappedAppEvent[] {
  const event = parseSlotHolidayPayload(payload);
  if (!event) return [];

  const active = event.type !== "delete";

  return [
    {
      type: APP_EVENT_TYPES.SLOT_HOLIDAY,
      payload: { bookingDate: event.bookingDate, active, label: event.label },
    },
  ];
}

export function mapPricingRuleChangeToEvents(payload: RealtimeChangePayload): MappedAppEvent[] {
  const event = parsePricingRulePayload(payload);
  if (!event) return [];

  const base = {
    ruleId: event.ruleId,
    groupId: event.groupId,
    active: event.active,
    type: event.ruleType,
  };

  if (event.type === "insert") {
    return [{ type: APP_EVENT_TYPES.PRICING_CREATED, payload: base }];
  }

  if (event.type === "delete") {
    return [{ type: APP_EVENT_TYPES.PRICING_DELETED, payload: base }];
  }

  // update
  if (event.active === false) {
    return [{ type: APP_EVENT_TYPES.PRICING_DEACTIVATED, payload: base }];
  }
  if (event.active === true) {
    return [{ type: APP_EVENT_TYPES.PRICING_ACTIVATED, payload: base }];
  }
  return [{ type: APP_EVENT_TYPES.PRICING_UPDATED, payload: base }];
}

export function mapMediaAssetChangeToEvents(payload: RealtimeChangePayload): MappedAppEvent[] {
  const event = parseMediaAssetPayload(payload);
  if (!event) return [];

  const base = { assetId: event.assetId, category: event.category, visibility: event.visibility };

  if (event.type === "insert") return [{ type: APP_EVENT_TYPES.MEDIA_UPLOADED, payload: base }];
  if (event.type === "delete") return [{ type: APP_EVENT_TYPES.MEDIA_DELETED, payload: base }];

  // update
  const deletedAt = (payload.new as Record<string, unknown> | undefined)?.deleted_at;
  if (deletedAt) return [{ type: APP_EVENT_TYPES.MEDIA_DELETED, payload: base }];
  if (deletedAt === null) return [{ type: APP_EVENT_TYPES.MEDIA_RESTORED, payload: base }];
  return [{ type: APP_EVENT_TYPES.MEDIA_UPDATED, payload: base }];
}

export function mapPromotionChangeToEvents(payload: RealtimeChangePayload): MappedAppEvent[] {
  const event = parsePromotionPayload(payload);
  if (!event) return [];

  const base = {
    promotionId: event.promotionId,
    title: event.title,
    status: event.status,
    contentType: event.contentType,
  };

  const events: MappedAppEvent[] = [];

  if (event.type === "insert") {
    events.push({ type: APP_EVENT_TYPES.PROMOTION_CREATED, payload: base });
  } else if (event.type === "delete") {
    events.push({ type: APP_EVENT_TYPES.PROMOTION_DELETED, payload: base });
  } else {
    events.push({ type: APP_EVENT_TYPES.PROMOTION_UPDATED, payload: base });
    if (event.status === "published") {
      events.push({ type: APP_EVENT_TYPES.PROMOTION_PUBLISHED, payload: base });
    }
    if (event.status === "expired") {
      events.push({ type: APP_EVENT_TYPES.PROMOTION_EXPIRED, payload: base });
    }
  }

  const locations = (payload.new as Record<string, unknown> | undefined)?.display_locations;
  const hasAnnouncementLocation =
    Array.isArray(locations) && locations.some((loc) => String(loc) === "announcement_bar");

  if (event.announcementEnabled || hasAnnouncementLocation) {
    events.push({
      type: APP_EVENT_TYPES.ANNOUNCEMENT_UPDATED,
      payload: { promotionId: event.promotionId, enabled: event.announcementEnabled },
    });
  }

  return events;
}

function parseSelectedSlots(record: Record<string, unknown> | undefined): string[] | undefined {
  if (!record) return undefined;
  const raw = record.selected_slots;
  if (!Array.isArray(raw)) return undefined;
  const slots = raw.map((value) => String(value)).filter(Boolean);
  return slots.length > 0 ? slots : undefined;
}

export function mapBookingChangeToEvents(payload: RealtimeChangePayload): MappedAppEvent[] {
  const parsed = parseBookingPayload(payload);
  if (!parsed) return [];

  const record = (payload.new ?? payload.old) as Record<string, unknown> | undefined;
  const selectedSlots = parseSelectedSlots(record);
  const source = record?.source ? String(record.source) : undefined;
  const remainingAmount = record?.remaining_amount ? Number(record.remaining_amount) : undefined;

  const base = {
    bookingId: parsed.bookingId,
    bookingReference: parsed.bookingReference,
    bookingDate: parsed.bookingDate,
    customerName: parsed.customerName,
    status: parsed.eventType,
    source,
    remainingAmount,
  };

  if (parsed.eventType === "INSERT") {
    if (source === "manual") {
      return [{ type: APP_EVENT_TYPES.BOOKING_MANUAL_CREATED, payload: base }];
    }
    return [{ type: APP_EVENT_TYPES.BOOKING_CREATED, payload: base }];
  }

  if (parsed.eventType === "UPDATE") {
    const status = (payload.new as Record<string, unknown> | undefined)?.status;
    if (status === "cancelled") {
      return [
        {
          type: APP_EVENT_TYPES.BOOKING_CANCELLED,
          payload: { ...base, status: "cancelled", selectedSlots },
        },
      ];
    }
    if (status === "completed") {
      return [{ type: APP_EVENT_TYPES.BOOKING_COMPLETED, payload: { ...base, status: "completed" } }];
    }
    if (status === "arrived") {
      return [{ type: APP_EVENT_TYPES.BOOKING_ARRIVED, payload: { ...base, status: "arrived" } }];
    }
    if (status === "in_progress") {
      return [{ type: APP_EVENT_TYPES.BOOKING_STARTED, payload: { ...base, status: "in_progress" } }];
    }
    return [{ type: APP_EVENT_TYPES.BOOKING_UPDATED, payload: { ...base, status: String(status ?? "updated") } }];
  }

  return [];
}

export function mapBookingPaymentRecordChangeToEvents(
  payload: RealtimeChangePayload,
): MappedAppEvent[] {
  if (payload.eventType !== "INSERT") return [];

  const record = payload.new as Record<string, unknown> | undefined;
  if (!record) return [];

  const base = {
    bookingId: String(record.booking_id ?? ""),
    collectedAmount: Number(record.amount ?? 0),
    method: record.method ? String(record.method) : undefined,
  };

  return [
    {
      type: APP_EVENT_TYPES.BOOKING_PAYMENT_COLLECTED,
      payload: base,
    },
    {
      type: APP_EVENT_TYPES.PAYMENT_COLLECTED,
      payload: base,
    },
  ];
}

export function mapPaymentChangeToEvents(payload: RealtimeChangePayload): MappedAppEvent[] {
  const record = (payload.new ?? payload.old) as Record<string, unknown> | undefined;
  if (!record) return [];

  const base = {
    paymentId: String(record.id ?? ""),
    bookingSessionId: record.booking_session_id ? String(record.booking_session_id) : undefined,
    amount: record.amount ? Number(record.amount) : undefined,
    status: record.status ? String(record.status) : undefined,
  };

  if (!base.paymentId) return [];

  if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
    if (base.status === "paid") {
      return [{ type: APP_EVENT_TYPES.PAYMENT_COMPLETED, payload: base }];
    }
    if (base.status === "failed" || base.status === "cancelled") {
      return [{ type: APP_EVENT_TYPES.PAYMENT_FAILED, payload: base }];
    }
  }

  return [];
}

export function mapBusinessSettingsChangeToEvents(): MappedAppEvent[] {
  return [
    {
      type: APP_EVENT_TYPES.BUSINESS_UPDATED,
      payload: { settingsId: "default" },
    },
    {
      type: APP_EVENT_TYPES.BRANDING_UPDATED,
      payload: { settingsId: "default", section: "branding" },
    },
    {
      type: APP_EVENT_TYPES.CONTACT_UPDATED,
      payload: { settingsId: "default", section: "contact" },
    },
    {
      type: APP_EVENT_TYPES.BOOKING_SETTINGS_UPDATED,
      payload: { settingsId: "default", section: "booking" },
    },
  ];
}
