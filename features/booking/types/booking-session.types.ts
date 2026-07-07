export type BookingSessionProfile = {
  name: string;
  phone: string;
  email: string;
};

export type BookingSession = {
  dateIso: string;
  selectedSlotIds: string[];
  timeRange: string | null;
  slotCount: number;
  totalDurationMinutes: number;
  totalDurationLabel: string;
  totalPrice: number;
  advanceAmount: number;
  remainingAmount: number;
  profile?: BookingSessionProfile;
  /** Server-side booking session id (set after create-order). */
  dbSessionId?: string;
  savedAt: string;
};

export const BOOKING_SESSION_KEY = "cig-booking-session";

export const EMPTY_BOOKING_SESSION: BookingSession | null = null;
