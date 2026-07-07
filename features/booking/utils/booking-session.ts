import type {
  BookingSession,
  BookingSessionProfile,
} from "@/features/booking/types/booking-session.types";
import { BOOKING_SESSION_KEY } from "@/features/booking/types/booking-session.types";
import type { BookingSelectionState, BookingSummary } from "@/features/booking/types";

export function saveBookingSession(
  selection: BookingSelectionState,
  summary: BookingSummary,
): void {
  if (typeof window === "undefined" || !selection.dateIso || summary.slotCount === 0) return;

  const session: BookingSession = {
    dateIso: selection.dateIso,
    selectedSlotIds: selection.selectedSlotIds,
    timeRange: summary.timeRange,
    slotCount: summary.slotCount,
    totalDurationMinutes: summary.totalDurationMinutes,
    totalDurationLabel: summary.totalDurationLabel,
    totalPrice: summary.totalPrice,
    advanceAmount: summary.advanceAmount,
    remainingAmount: summary.remainingAmount,
    savedAt: new Date().toISOString(),
  };

  sessionStorage.setItem(BOOKING_SESSION_KEY, JSON.stringify(session));
}

export function readBookingSession(): BookingSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(BOOKING_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BookingSession;
  } catch {
    return null;
  }
}

export function updateBookingSessionProfile(profile: BookingSessionProfile): void {
  if (typeof window === "undefined") return;

  const session = readBookingSession();
  if (!session) return;

  const updated: BookingSession = {
    ...session,
    profile,
    savedAt: new Date().toISOString(),
  };

  sessionStorage.setItem(BOOKING_SESSION_KEY, JSON.stringify(updated));
}

export function updateBookingSessionDbId(dbSessionId: string): void {
  if (typeof window === "undefined") return;

  const session = readBookingSession();
  if (!session) return;

  const updated: BookingSession = {
    ...session,
    dbSessionId,
    savedAt: new Date().toISOString(),
  };

  sessionStorage.setItem(BOOKING_SESSION_KEY, JSON.stringify(updated));
}

export function clearBookingSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(BOOKING_SESSION_KEY);
}

export function hasBookingSession(): boolean {
  return readBookingSession() !== null;
}

export function bookingSessionToSelection(session: BookingSession): BookingSelectionState {
  return {
    dateIso: session.dateIso,
    selectedSlotIds: session.selectedSlotIds,
  };
}
