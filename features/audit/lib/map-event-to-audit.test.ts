import { describe, expect, it } from "vitest";

import { createAuditRecordFromEvent } from "@/features/audit/lib/map-event-to-audit";
import { APP_EVENT_TYPES } from "@/features/events/constants/event-types";
import { createAppEventEnvelope } from "@/features/events/lib/event-bus";

describe("map event to audit", () => {
  it("maps booking created events", () => {
    const event = createAppEventEnvelope(APP_EVENT_TYPES.BOOKING_CREATED, {
      bookingId: "bk_1",
      bookingReference: "CIG-100",
      customerName: "Rahul",
      status: "confirmed",
    });

    const record = createAuditRecordFromEvent(event, { email: "owner@cig.com" });
    expect(record?.action).toBe("Booking Created");
    expect(record?.category).toBe("bookings");
    expect(record?.bookingId).toBe("bk_1");
    expect(record?.customerName).toBe("Rahul");
  });

  it("maps slot blocked events", () => {
    const event = createAppEventEnvelope(APP_EVENT_TYPES.SLOT_BLOCKED, {
      slotId: "2026-07-07-1080",
      bookingDate: "2026-07-07",
    });

    const record = createAuditRecordFromEvent(event);
    expect(record?.action).toBe("Slot Blocked");
    expect(record?.category).toBe("slots");
  });

  it("maps auth login events", () => {
    const event = createAppEventEnvelope(APP_EVENT_TYPES.AUTH_LOGIN_SUCCESS, {
      userId: "user_1",
      email: "owner@cig.com",
    });

    const record = createAuditRecordFromEvent(event);
    expect(record?.action).toBe("Owner Login");
    expect(record?.category).toBe("authentication");
  });

  it("returns null for unsupported events", () => {
    const event = createAppEventEnvelope(APP_EVENT_TYPES.NOTIFICATION_CREATED, {
      notificationId: "n1",
      title: "Test",
      message: "Hello",
      type: "admin_message",
    });

    expect(createAuditRecordFromEvent(event)).toBeNull();
  });
});
