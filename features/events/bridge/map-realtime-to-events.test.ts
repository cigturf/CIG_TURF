import { describe, expect, it } from "vitest";

import { APP_EVENT_TYPES } from "@/features/events/constants/event-types";
import {
  mapBookedSlotChangeToEvents,
  mapBookingChangeToEvents,
} from "@/features/events/bridge/map-realtime-to-events";

describe("map realtime to app events", () => {
  it("maps booked slot insert to slot.booked", () => {
    const events = mapBookedSlotChangeToEvents({
      eventType: "INSERT",
      new: { slot_id: "2026-07-07-540", booking_date: "2026-07-07" },
      old: {},
      schema: "public",
      table: "booked_slots",
      commit_timestamp: "2026-07-07T00:00:00.000Z",
      errors: [],
    } as never);

    expect(events[0]?.type).toBe(APP_EVENT_TYPES.SLOT_BOOKED);
  });

  it("maps booking insert to booking.created", () => {
    const events = mapBookingChangeToEvents({
      eventType: "INSERT",
      new: {
        id: "bk_1",
        booking_reference: "CIG-20260707-0001",
        booking_date: "2026-07-07",
        customer_name: "Rohit",
      },
      old: {},
      schema: "public",
      table: "bookings",
      commit_timestamp: "2026-07-07T00:00:00.000Z",
      errors: [],
    } as never);

    expect(events[0]?.type).toBe(APP_EVENT_TYPES.BOOKING_CREATED);
  });

  it("maps manual booking insert to booking.manual.created", () => {
    const events = mapBookingChangeToEvents({
      eventType: "INSERT",
      new: {
        id: "bk_2",
        booking_reference: "CIG-20260707-0002",
        booking_date: "2026-07-07",
        customer_name: "Admin",
        source: "manual",
      },
      old: {},
      schema: "public",
      table: "bookings",
      commit_timestamp: "2026-07-07T00:00:00.000Z",
      errors: [],
    } as never);

    expect(events[0]?.type).toBe(APP_EVENT_TYPES.BOOKING_MANUAL_CREATED);
  });

  it("maps booking cancel to booking.cancelled with selected slots", () => {
    const events = mapBookingChangeToEvents({
      eventType: "UPDATE",
      new: {
        id: "bk_1",
        booking_reference: "CIG-20260707-0001",
        booking_date: "2026-07-07",
        customer_name: "Rohit",
        status: "cancelled",
        selected_slots: ["2026-07-07-540", "2026-07-07-570"],
      },
      old: { status: "confirmed" },
      schema: "public",
      table: "bookings",
      commit_timestamp: "2026-07-07T00:00:00.000Z",
      errors: [],
    } as never);

    expect(events[0]?.type).toBe(APP_EVENT_TYPES.BOOKING_CANCELLED);
    expect(events[0]?.payload).toMatchObject({
      selectedSlots: ["2026-07-07-540", "2026-07-07-570"],
    });
  });

  it("maps booking update to booking.updated", () => {
    const events = mapBookingChangeToEvents({
      eventType: "UPDATE",
      new: {
        id: "bk_1",
        booking_reference: "CIG-20260707-0001",
        status: "confirmed",
        remaining_amount: 0,
      },
      old: { status: "confirmed", remaining_amount: 500 },
      schema: "public",
      table: "bookings",
      commit_timestamp: "2026-07-07T00:00:00.000Z",
      errors: [],
    } as never);

    expect(events[0]?.type).toBe(APP_EVENT_TYPES.BOOKING_UPDATED);
  });
});
