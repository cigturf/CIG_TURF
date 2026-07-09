import type {
  AdminBookingDetail,
  CancelBookingInput,
  CollectPaymentInput,
  CompleteBookingInput,
  CreateManualBookingInput,
  UpdateBookingInput,
} from "@/features/admin/bookings/types/admin-booking.types";
import {
  canCompleteBooking,
  canMarkArrived,
  canStartMatch,
} from "@/features/admin/bookings/lib/booking-status";
import { toAdminBookingRecord } from "@/features/admin/bookings/lib/booking-utils";
import {
  createBookingAuditLog,
  listAuditLogsForBooking,
} from "@/features/admin/bookings/services/booking-audit.repository";
import {
  createBookingPaymentRecord,
  listPaymentRecordsForBooking,
} from "@/features/admin/bookings/services/booking-payment.repository";
import { buildBookingTimeline } from "@/features/admin/bookings/services/booking-timeline.service";
import { refundOnlineAdvanceForBooking } from "@/features/payments/services/payment-refund.service";
import { releaseSlotHoldsForSession } from "@/features/booking/services/slot-hold.repository";
import { getPaymentById } from "@/features/payments/services/payment.repository";
import { BOOKING_DEFAULTS } from "@/features/booking/config";
import {
  createBookingRecord,
  deleteBookingById,
  getBookingById,
  updateBookingRecord,
} from "@/features/booking/services/booking.repository";
import { generateBookingReference } from "@/features/booking/services/booking-reference.service";
import {
  getUnavailableSlotIds,
  releaseBookedSlotsForBooking,
  reserveBookedSlots,
} from "@/features/booking/services/booked-slot.repository";
import { resolveSlotTimeBounds } from "@/features/booking/utils/slot-id";
import { dispatchBookingCancelledEmails, dispatchBookingConfirmedEmails, dispatchPartialPaymentEmails, dispatchPaymentCollectedEmails, publishCommunicationEvent } from "@/features/communication/services/communication-dispatcher";
import { APP_EVENT_TYPES } from "@/features/events/constants/event-types";
import {
  createBookingSession,
  updateBookingSessionStatus,
} from "@/features/payments/services/booking-session.repository";
import { createPaymentRecord } from "@/features/payments/services/payment.repository";
import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { randomUUID } from "crypto";

type AdminActor = {
  userId: string;
  email?: string | null;
};

async function markManualPaymentPaid(paymentId: string, amount: number, method: string) {
  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  if (supabase) {
    await supabase
      .from("payments")
      .update({
        status: "paid",
        amount,
        payment_method: method,
        razorpay_payment_id: `manual-${paymentId}`,
        updated_at: now,
      })
      .eq("id", paymentId);
    return;
  }

  try {
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "paid",
        amount,
        paymentMethod: method,
        razorpayPaymentId: `manual-${paymentId}`,
      },
    });
  } catch {
    // best effort
  }
}

async function loadAdminBookingDetail(id: string): Promise<AdminBookingDetail | null> {
  const booking = await getBookingById(id);
  if (!booking) return null;

  const [payments, auditLogs] = await Promise.all([
    listPaymentRecordsForBooking(id),
    listAuditLogsForBooking(id),
  ]);

  return {
    ...toAdminBookingRecord(booking),
    payments,
    auditLogs,
    timeline: buildBookingTimeline(booking, payments),
  };
}

async function logBookingChange(
  bookingId: string,
  actor: AdminActor,
  action: string,
  fieldName: string,
  oldValue: string | null,
  newValue: string | null,
  metadata?: Record<string, unknown>,
) {
  await createBookingAuditLog({
    bookingId,
    actorId: actor.userId,
    actorEmail: actor.email ?? null,
    action,
    fieldName,
    oldValue,
    newValue,
    metadata: metadata ?? null,
  });
}

export async function getAdminBookingDetail(id: string): Promise<AdminBookingDetail | null> {
  return loadAdminBookingDetail(id);
}

export async function createManualBooking(
  input: CreateManualBookingInput,
  adminUserId: string,
): Promise<AdminBookingDetail> {
  const customerEmail = input.customerEmail?.trim().toLowerCase() ?? "";
  const customerPhone = input.customerPhone?.trim() ?? "";
  const slotIds = input.selectedSlots;
  const unavailable = await getUnavailableSlotIds(slotIds, { respectAllHolds: true });
  if (unavailable.length > 0) {
    throw new Error("Selected slots are no longer available.");
  }

  const timeBounds = resolveSlotTimeBounds(slotIds, BOOKING_DEFAULTS.slotDurationMinutes);
  if (!timeBounds) {
    throw new Error("Invalid slot selection.");
  }

  const durationMinutes = slotIds.length * BOOKING_DEFAULTS.slotDurationMinutes;
  const durationLabel =
    durationMinutes >= 60
      ? `${Math.floor(durationMinutes / 60)} hr${durationMinutes % 60 ? ` ${durationMinutes % 60} min` : ""}`
      : `${durationMinutes} min`;

  const session = await createBookingSession({
    userId: adminUserId,
    selectedDate: input.bookingDate,
    selectedSlots: slotIds,
    timeRange: `${timeBounds.startTime} – ${timeBounds.endTime}`,
    slotCount: slotIds.length,
    totalDurationMinutes: durationMinutes,
    totalDurationLabel: durationLabel,
    totalPrice: input.totalPrice,
    advanceAmount: input.advancePaid,
    remainingAmount: input.remainingAmount,
    profileName: input.customerName,
    profilePhone: customerPhone,
    profileEmail: customerEmail,
  });

  await updateBookingSessionStatus(session.id, "payment_completed");

  const payment = await createPaymentRecord({
    bookingSessionId: session.id,
    userId: adminUserId,
    razorpayOrderId: `manual-${randomUUID()}`,
    amount: input.advancePaid,
    currency: "INR",
  });

  await markManualPaymentPaid(payment.id, input.advancePaid, "manual");

  const bookingReference = await generateBookingReference(input.bookingDate);

  const booking = await createBookingRecord({
    bookingReference,
    userId: adminUserId,
    bookingSessionId: session.id,
    paymentId: payment.id,
    bookingDate: input.bookingDate,
    startTime: timeBounds.startTime,
    endTime: timeBounds.endTime,
    selectedSlots: slotIds,
    durationMinutes,
    totalPrice: input.totalPrice,
    advancePaid: input.advancePaid,
    remainingAmount: input.remainingAmount,
    customerName: input.customerName,
    customerPhone,
    customerEmail,
    source: "manual",
    notes: input.notes ?? null,
  });

  const reservation = await reserveBookedSlots({
    bookingId: booking.id,
    slotIds,
  });

  if (!reservation.success) {
    await releaseBookedSlotsForBooking(booking.id);
    await deleteBookingById(booking.id);
    throw new Error("Unable to reserve selected slots.");
  }

  if (input.advancePaid > 0) {
    await createBookingPaymentRecord({
      bookingId: booking.id,
      type: "advance",
      amount: input.advancePaid,
      method: "cash",
      collectedBy: adminUserId,
      notes: "Manual booking advance",
    });
  }

  const detail = await loadAdminBookingDetail(booking.id);
  if (!detail) throw new Error("Failed to load created booking.");

  await dispatchBookingConfirmedEmails(detail);

  publishCommunicationEvent(APP_EVENT_TYPES.BOOKING_MANUAL_CREATED, {
    bookingId: booking.id,
    bookingReference: booking.bookingReference,
    bookingDate: booking.bookingDate,
    customerName: booking.customerName,
    source: "manual",
  });

  return detail;
}

export async function updateAdminBooking(
  id: string,
  input: UpdateBookingInput,
): Promise<AdminBookingDetail | null> {
  const updated = await updateBookingRecord(id, input);
  if (!updated) return null;
  return loadAdminBookingDetail(id);
}

export async function cancelAdminBooking(
  id: string,
  input: CancelBookingInput,
  actor: AdminActor,
): Promise<AdminBookingDetail | null> {
  const booking = await getBookingById(id);
  if (!booking) return null;
  if (booking.status === "cancelled") return loadAdminBookingDetail(id);

  const updated = await updateBookingRecord(id, {
    status: "cancelled",
    cancellationReason: input.reason,
  });

  if (!updated) return null;

  const releasedSlotIds = await releaseBookedSlotsForBooking(id);
  await releaseSlotHoldsForSession(booking.bookingSessionId);
  if (releasedSlotIds.length === 0 && booking.selectedSlots.length > 0) {
    console.warn(
      `[cancelAdminBooking] No booked_slots rows released for booking ${id} (${booking.selectedSlots.length} slots on record)`,
    );
  }

  if (booking.source === "online" && booking.advancePaid > 0) {
    const payment = await getPaymentById(booking.paymentId);
    if (payment?.status === "paid" && payment.razorpayPaymentId) {
      await refundOnlineAdvanceForBooking({
        payment,
        bookingId: id,
        amountInr: booking.advancePaid,
        reason: input.reason,
        collectedBy: actor.userId,
      });
    }
  }

  await logBookingChange(id, actor, "booking.cancelled", "status", booking.status, "cancelled", {
    reason: input.reason,
  });

  await dispatchBookingCancelledEmails(updated);

  publishCommunicationEvent(APP_EVENT_TYPES.BOOKING_CANCELLED, {
    bookingId: id,
    bookingReference: updated.bookingReference,
    bookingDate: updated.bookingDate,
    customerName: updated.customerName,
    selectedSlots: booking.selectedSlots,
  });

  return loadAdminBookingDetail(id);
}

export async function markBookingArrived(
  id: string,
  actor: AdminActor,
): Promise<AdminBookingDetail | null> {
  const booking = await getBookingById(id);
  if (!booking) return null;
  if (!canMarkArrived(booking.status)) {
    throw new Error("Only confirmed bookings can be marked as arrived.");
  }

  const now = new Date();
  const updated = await updateBookingRecord(id, {
    status: "arrived",
    arrivedAt: now,
  });

  if (!updated) return null;

  await logBookingChange(id, actor, "booking.arrived", "status", booking.status, "arrived");

  return loadAdminBookingDetail(id);
}

export async function startBookingMatch(
  id: string,
  actor: AdminActor,
): Promise<AdminBookingDetail | null> {
  const booking = await getBookingById(id);
  if (!booking) return null;
  if (!canStartMatch(booking.status)) {
    throw new Error("Customer must be checked in before starting the match.");
  }

  const now = new Date();
  const updated = await updateBookingRecord(id, {
    status: "in_progress",
    matchStartedAt: now,
  });

  if (!updated) return null;

  await logBookingChange(id, actor, "booking.started", "status", booking.status, "in_progress");

  return loadAdminBookingDetail(id);
}

export async function completeAdminBooking(
  id: string,
  input: CompleteBookingInput = {},
  actor: AdminActor,
): Promise<AdminBookingDetail | null> {
  const booking = await getBookingById(id);
  if (!booking) return null;
  if (booking.status === "completed") return loadAdminBookingDetail(id);
  if (booking.status === "cancelled") {
    throw new Error("Cancelled bookings cannot be completed.");
  }
  if (!canCompleteBooking(booking.status)) {
    throw new Error("Booking cannot be completed from its current status.");
  }

  if (booking.remainingAmount > 0 && !input.overrideOutstanding) {
    throw new Error("Outstanding payment must be collected before completing this booking.");
  }

  if (booking.remainingAmount > 0 && input.overrideOutstanding) {
    if (!input.overrideReason?.trim()) {
      throw new Error("Override reason is required when completing with outstanding payment.");
    }
    await logBookingChange(
      id,
      actor,
      "booking.complete.override",
      "remaining_amount",
      String(booking.remainingAmount),
      "0",
      { reason: input.overrideReason.trim() },
    );
  }

  const now = new Date();
  const updated = await updateBookingRecord(id, {
    status: "completed",
    matchCompletedAt: now,
  });

  if (!updated) return null;

  await logBookingChange(id, actor, "booking.completed", "status", booking.status, "completed");

  return loadAdminBookingDetail(id);
}

export async function collectBookingPayment(
  id: string,
  input: CollectPaymentInput,
  actor: AdminActor,
): Promise<AdminBookingDetail | null> {
  const booking = await getBookingById(id);
  if (!booking) return null;
  if (booking.status === "cancelled") {
    throw new Error("Cannot collect payment for a cancelled booking.");
  }

  const amount = Math.min(input.amount, booking.remainingAmount);
  if (amount <= 0) {
    throw new Error("No remaining amount to collect.");
  }

  await createBookingPaymentRecord({
    bookingId: id,
    type: "remaining",
    amount,
    method: input.method,
    collectedBy: actor.userId,
    notes: input.notes ?? null,
    referenceNumber: input.referenceNumber ?? null,
  });

  const newRemaining = booking.remainingAmount - amount;
  const updated = await updateBookingRecord(id, {
    advancePaid: booking.advancePaid + amount,
    remainingAmount: newRemaining,
  });

  if (!updated) return null;

  await logBookingChange(
    id,
    actor,
    newRemaining <= 0 ? "payment.completed" : "payment.partial",
    "remaining_amount",
    String(booking.remainingAmount),
    String(newRemaining),
    {
      collectedAmount: amount,
      method: input.method,
      referenceNumber: input.referenceNumber ?? null,
    },
  );

  if (newRemaining <= 0) {
    await dispatchPaymentCollectedEmails(updated, {
      collectedAmount: amount,
      method: input.method,
      referenceNumber: input.referenceNumber ?? null,
      remainingAmount: newRemaining,
    });
  } else {
    await dispatchPartialPaymentEmails(updated, {
      collectedAmount: amount,
      method: input.method,
      referenceNumber: input.referenceNumber ?? null,
      remainingAmount: newRemaining,
    });
  }

  publishCommunicationEvent(
    newRemaining <= 0 ? APP_EVENT_TYPES.PAYMENT_COLLECTED : APP_EVENT_TYPES.PAYMENT_PARTIAL,
    {
      bookingId: id,
      bookingReference: updated.bookingReference,
      collectedAmount: amount,
      method: input.method,
      referenceNumber: input.referenceNumber ?? null,
      remainingAmount: newRemaining,
    },
  );

  return loadAdminBookingDetail(id);
}

export async function duplicateAdminBooking(
  id: string,
  adminUserId: string,
): Promise<AdminBookingDetail | null> {
  const booking = await getBookingById(id);
  if (!booking) return null;

  return createManualBooking(
    {
      bookingDate: booking.bookingDate,
      selectedSlots: booking.selectedSlots,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerEmail: booking.customerEmail || undefined,
      totalPrice: booking.totalPrice,
      advancePaid: booking.advancePaid,
      remainingAmount: booking.remainingAmount,
      notes: booking.notes ? `Duplicate of ${booking.bookingReference}` : undefined,
    },
    adminUserId,
  );
}
