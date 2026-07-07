import { APP_EVENT_TYPES } from "@/features/events/constants/event-types";
import type { AppEventType } from "@/features/events/constants/event-types";
import { getEventBus } from "@/features/events/lib/event-bus";
import type { AppEventPayloadMap } from "@/features/events/types/event.types";
import { CommunicationService } from "@/features/communication/services/communication.service";
import { getBookingById } from "@/features/booking/services/booking.repository";
import type { BookingRecord } from "@/features/booking/types/booking-record.types";

let registered = false;

function logCommunicationError(action: string, error: unknown): void {
  console.error(`[Communication] ${action} failed:`, error);
}

/** Await email delivery during the request — fire-and-forget event handlers are unreliable in API routes. */
export async function dispatchBookingConfirmedEmails(booking: BookingRecord): Promise<void> {
  try {
    await CommunicationService.sendBookingConfirmed(booking);
  } catch (error) {
    logCommunicationError("booking confirmed email", error);
  }
}

export async function dispatchBookingCancelledEmails(booking: BookingRecord): Promise<void> {
  try {
    await CommunicationService.sendBookingCancelled(booking);
  } catch (error) {
    logCommunicationError("booking cancelled email", error);
  }
}

export async function dispatchPaymentCollectedEmails(
  booking: BookingRecord,
  payment: {
    collectedAmount: number;
    method: string;
    referenceNumber?: string | null;
    remainingAmount: number;
  },
): Promise<void> {
  try {
    await CommunicationService.sendPaymentReceived(booking, {
      amount: payment.collectedAmount,
      method: payment.method,
      referenceNumber: payment.referenceNumber ?? null,
      outstandingBalance: payment.remainingAmount,
    });
    await CommunicationService.sendPaymentCollectedOwner(booking, {
      amount: payment.collectedAmount,
      method: payment.method,
      referenceNumber: payment.referenceNumber ?? null,
    });
  } catch (error) {
    logCommunicationError("payment collected email", error);
  }
}

export async function dispatchPartialPaymentEmails(
  booking: BookingRecord,
  payment: {
    collectedAmount: number;
    method: string;
    referenceNumber?: string | null;
    remainingAmount: number;
  },
): Promise<void> {
  try {
    await CommunicationService.sendPaymentReceived(booking, {
      amount: payment.collectedAmount,
      method: payment.method,
      referenceNumber: payment.referenceNumber ?? null,
      outstandingBalance: payment.remainingAmount,
    });
  } catch (error) {
    logCommunicationError("partial payment email", error);
  }
}

/**
 * Server-side communication dispatcher for events that are not yet awaited at the call site.
 * Booking confirmation/cancellation emails are dispatched directly from booking services.
 */
export function registerCommunicationEventHandlers(): void {
  if (registered) return;
  registered = true;

  const bus = getEventBus();

  const handlers: Partial<{
    [K in AppEventType]: (payload: AppEventPayloadMap[K]) => void | Promise<void>;
  }> = {
    [APP_EVENT_TYPES.PAYMENT_COMPLETED]: async (payload) => {
      if (!payload.bookingId) return;
      const booking = await getBookingById(payload.bookingId);
      if (!booking) return;
      try {
        await CommunicationService.sendPaymentReceived(booking, {
          amount: payload.amount ?? booking.advancePaid,
          method: payload.method ?? "Online",
          referenceNumber: payload.referenceNumber ?? null,
          outstandingBalance: booking.remainingAmount,
        });
      } catch (error) {
        logCommunicationError("payment completed email", error);
      }
    },
    [APP_EVENT_TYPES.PAYMENT_FAILED]: async (payload) => {
      try {
        await CommunicationService.sendPaymentFailedOwner({
          sessionId: payload.bookingSessionId ?? payload.paymentId,
          customerEmail: payload.customerEmail ?? null,
          reason: payload.reason ?? payload.status ?? "Payment failed",
        });
      } catch (error) {
        logCommunicationError("payment failed owner email", error);
      }
    },
  };

  for (const [type, handler] of Object.entries(handlers)) {
    if (!handler) continue;
    bus.subscribe(type as AppEventType, (event) => {
      void handler(event.payload as never);
    });
  }
}

export function publishCommunicationEvent<T extends AppEventType>(
  type: T,
  payload: AppEventPayloadMap[T],
): void {
  registerCommunicationEventHandlers();
  getEventBus().publish(type, payload, "server");
}

registerCommunicationEventHandlers();
