import { parseSlotId } from "@/features/booking/utils/slot-id";
import type { RealtimeChangePayload, RealtimeSlotEvent } from "@/features/realtime/types/realtime.types";

export function parseBookedSlotPayload(payload: RealtimeChangePayload): RealtimeSlotEvent | null {
  const record = (payload.new ?? payload.old) as Record<string, unknown> | null;
  if (!record) return null;

  const slotId = String(record.slot_id ?? "");
  const bookingDate = String(record.booking_date ?? "");
  if (!slotId || !bookingDate) return null;

  if (payload.eventType === "INSERT") {
    return { type: "insert", slotId, bookingDate, payload };
  }

  if (payload.eventType === "DELETE") {
    return { type: "delete", slotId, bookingDate, payload };
  }

  return null;
}

export function parseSlotHoldPayload(payload: RealtimeChangePayload): RealtimeSlotEvent | null {
  const record = (payload.new ?? payload.old) as Record<string, unknown> | null;
  if (!record) return null;

  const slotId = String(record.slot_id ?? "");
  const parsed = parseSlotId(slotId);
  if (!slotId || !parsed) return null;

  if (payload.eventType === "INSERT") {
    return { type: "insert", slotId, bookingDate: parsed.dateIso, payload };
  }

  if (payload.eventType === "DELETE") {
    return { type: "delete", slotId, bookingDate: parsed.dateIso, payload };
  }

  return null;
}

export type RealtimeSlotBlockEvent = {
  type: "insert" | "update" | "delete";
  bookingDate: string;
  slotId: string;
  state: "blocked" | "maintenance";
  reason?: string | null;
  payload: RealtimeChangePayload;
};

export function parseSlotBlockPayload(payload: RealtimeChangePayload): RealtimeSlotBlockEvent | null {
  const record = (payload.new ?? payload.old) as Record<string, unknown> | null;
  if (!record) return null;

  const bookingDate = String(record.booking_date ?? "");
  const slotId = String(record.slot_id ?? "");
  const state = String(record.state ?? "") as "blocked" | "maintenance";
  const reason = record.reason != null ? String(record.reason) : null;
  if (!bookingDate || !slotId || (state !== "blocked" && state !== "maintenance")) return null;

  if (payload.eventType === "INSERT") {
    return { type: "insert", bookingDate, slotId, state, reason, payload };
  }
  if (payload.eventType === "UPDATE") {
    return { type: "update", bookingDate, slotId, state, reason, payload };
  }
  if (payload.eventType === "DELETE") {
    return { type: "delete", bookingDate, slotId, state, reason, payload };
  }
  return null;
}

export type RealtimeHolidayEvent = {
  type: "insert" | "update" | "delete";
  bookingDate: string;
  label?: string;
  payload: RealtimeChangePayload;
};

export function parseSlotHolidayPayload(payload: RealtimeChangePayload): RealtimeHolidayEvent | null {
  const record = (payload.new ?? payload.old) as Record<string, unknown> | null;
  if (!record) return null;

  const bookingDate = String(record.booking_date ?? "");
  const label = record.label ? String(record.label) : undefined;
  if (!bookingDate) return null;

  if (payload.eventType === "INSERT") return { type: "insert", bookingDate, label, payload };
  if (payload.eventType === "UPDATE") return { type: "update", bookingDate, label, payload };
  if (payload.eventType === "DELETE") return { type: "delete", bookingDate, label, payload };
  return null;
}

export type RealtimePricingRuleEvent = {
  type: "insert" | "update" | "delete";
  ruleId: string;
  groupId?: string;
  active?: boolean;
  ruleType?: string;
  payload: RealtimeChangePayload;
};

export function parsePricingRulePayload(payload: RealtimeChangePayload): RealtimePricingRuleEvent | null {
  const record = (payload.new ?? payload.old) as Record<string, unknown> | null;
  if (!record) return null;

  const ruleId = String(record.id ?? "");
  if (!ruleId) return null;

  const groupId = record.group_id ? String(record.group_id) : undefined;
  const active = record.active !== undefined ? Boolean(record.active) : undefined;
  const ruleType = record.type ? String(record.type) : undefined;

  if (payload.eventType === "INSERT") return { type: "insert", ruleId, groupId, active, ruleType, payload };
  if (payload.eventType === "UPDATE") return { type: "update", ruleId, groupId, active, ruleType, payload };
  if (payload.eventType === "DELETE") return { type: "delete", ruleId, groupId, active, ruleType, payload };
  return null;
}

export type RealtimeMediaAssetEvent = {
  type: "insert" | "update" | "delete";
  assetId: string;
  visibility?: string;
  category?: string;
  payload: RealtimeChangePayload;
};

export function parseMediaAssetPayload(payload: RealtimeChangePayload): RealtimeMediaAssetEvent | null {
  const record = (payload.new ?? payload.old) as Record<string, unknown> | null;
  if (!record) return null;

  const assetId = String(record.id ?? "");
  if (!assetId) return null;

  const visibility = record.visibility ? String(record.visibility) : undefined;
  const category = record.category ? String(record.category) : undefined;

  if (payload.eventType === "INSERT") return { type: "insert", assetId, visibility, category, payload };
  if (payload.eventType === "UPDATE") return { type: "update", assetId, visibility, category, payload };
  if (payload.eventType === "DELETE") return { type: "delete", assetId, visibility, category, payload };
  return null;
}

export type RealtimePromotionEvent = {
  type: "insert" | "update" | "delete";
  promotionId: string;
  title?: string;
  status?: string;
  contentType?: string;
  announcementEnabled?: boolean;
  payload: RealtimeChangePayload;
};

export function parsePromotionPayload(payload: RealtimeChangePayload): RealtimePromotionEvent | null {
  const record = (payload.new ?? payload.old) as Record<string, unknown> | null;
  if (!record) return null;

  const promotionId = String(record.id ?? "");
  if (!promotionId) return null;

  const title = record.title ? String(record.title) : undefined;
  const status = record.status ? String(record.status) : undefined;
  const contentType = record.content_type ? String(record.content_type) : undefined;
  const announcementEnabled =
    record.announcement_enabled !== undefined ? Boolean(record.announcement_enabled) : undefined;

  if (payload.eventType === "INSERT") {
    return { type: "insert", promotionId, title, status, contentType, announcementEnabled, payload };
  }
  if (payload.eventType === "UPDATE") {
    return { type: "update", promotionId, title, status, contentType, announcementEnabled, payload };
  }
  if (payload.eventType === "DELETE") {
    return { type: "delete", promotionId, title, status, contentType, announcementEnabled, payload };
  }
  return null;
}

export function parseBookingPayload(payload: RealtimeChangePayload) {
  const record = (payload.new ?? payload.old) as Record<string, unknown> | null;
  if (!record) return null;

  const bookingId = String(record.id ?? "");
  if (!bookingId) return null;

  return {
    bookingId,
    bookingDate: record.booking_date ? String(record.booking_date) : undefined,
    bookingReference: record.booking_reference ? String(record.booking_reference) : undefined,
    customerName: record.customer_name ? String(record.customer_name) : undefined,
    eventType: payload.eventType,
    payload,
  };
}

export function applyBookedSlotChange(current: string[], event: RealtimeSlotEvent): string[] {
  if (event.type === "insert") {
    if (current.includes(event.slotId)) return current;
    return [...current, event.slotId];
  }

  return current.filter((slotId) => slotId !== event.slotId);
}
