import { describe, expect, it, beforeEach } from "vitest";

import { APP_EVENT_TYPES } from "@/features/events/constants/event-types";
import {
  EventBus,
  createAppEventEnvelope,
  parseAppEvent,
  resetEventBusForTests,
  serializeAppEvent,
} from "@/features/events/lib/event-bus";

describe("event bus", () => {
  beforeEach(() => {
    resetEventBusForTests();
  });

  it("publishes and delivers typed events to subscribers", () => {
    const bus = new EventBus();
    const received: string[] = [];

    bus.subscribe(APP_EVENT_TYPES.BOOKING_CREATED, (event) => {
      received.push((event.payload as { bookingId: string }).bookingId);
    });

    bus.publish(APP_EVENT_TYPES.BOOKING_CREATED, { bookingId: "bk_1" }, "client");

    expect(received).toEqual(["bk_1"]);
  });

  it("supports wildcard subscribers", () => {
    const bus = new EventBus();
    let count = 0;

    bus.subscribe("*", () => {
      count += 1;
    });

    bus.publish(APP_EVENT_TYPES.SLOT_BLOCKED, {
      slotId: "2026-07-07-540",
      bookingDate: "2026-07-07",
    });

    expect(count).toBe(1);
  });

  it("unsubscribes cleanly", () => {
    const bus = new EventBus();
    let count = 0;
    const unsubscribe = bus.subscribe(APP_EVENT_TYPES.BUSINESS_UPDATED, () => {
      count += 1;
    });

    unsubscribe();
    bus.publish(APP_EVENT_TYPES.BUSINESS_UPDATED, { settingsId: "default" });

    expect(count).toBe(0);
  });

  it("serializes envelopes for mobile consumers", () => {
    const envelope = createAppEventEnvelope(
      APP_EVENT_TYPES.PAYMENT_COMPLETED,
      { paymentId: "pay_1", amount: 200 },
      "bridge",
    );

    const raw = serializeAppEvent(envelope);
    const parsed = parseAppEvent(raw);

    expect(parsed?.type).toBe(APP_EVENT_TYPES.PAYMENT_COMPLETED);
    expect(parsed?.payload).toEqual({ paymentId: "pay_1", amount: 200 });
  });
});
