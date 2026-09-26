import type {
  BookingSession,
  BookingSessionProfile,
} from "@/features/booking/types/booking-session.types";
import { BOOKING_SESSION_KEY } from "@/features/booking/types/booking-session.types";
import type { BookingSelectionState, BookingSummary } from "@/features/booking/types";

/**
 * How long a saved selection stays valid before it's treated as stale and
 * discarded on read. Wide enough to comfortably cover a login round-trip
 * (Google OAuth consent, a magic link opened from an email app, typing an
 * OTP) — this isn't a hard deadline for the booking itself, just a guard
 * against resurrecting a selection from a genuinely abandoned, long-past visit.
 */
const BOOKING_SESSION_TTL_MS = 2 * 60 * 60 * 1000;

/**
 * Deliberately localStorage, not sessionStorage: this has to survive the
 * user leaving the tab's origin entirely and coming back — Google's OAuth
 * consent screen, a magic-link email opened in a new tab, an OTP screen that
 * reloads. sessionStorage is scoped to the browsing context and isn't
 * reliably preserved across all of those, which is exactly what silently
 * lost the selection and bounced people back to /book after logging in.
 */
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

  localStorage.setItem(BOOKING_SESSION_KEY, JSON.stringify(session));
}

export function readBookingSession(): BookingSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(BOOKING_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as BookingSession;

    const savedAtMs = Date.parse(session.savedAt);
    if (Number.isNaN(savedAtMs) || Date.now() - savedAtMs > BOOKING_SESSION_TTL_MS) {
      localStorage.removeItem(BOOKING_SESSION_KEY);
      return null;
    }

    return session;
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

  localStorage.setItem(BOOKING_SESSION_KEY, JSON.stringify(updated));
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

  localStorage.setItem(BOOKING_SESSION_KEY, JSON.stringify(updated));
}

export function clearBookingSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(BOOKING_SESSION_KEY);
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
