export type BookingStatus =
  | "confirmed"
  | "arrived"
  | "in_progress"
  | "cancelled"
  | "completed"
  | "expired";

export type BookingSource = "online" | "manual";

export type BookingRecord = {
  id: string;
  bookingReference: string;
  userId: string;
  bookingSessionId: string;
  paymentId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  selectedSlots: string[];
  durationMinutes: number;
  totalPrice: number;
  advancePaid: number;
  remainingAmount: number;
  status: BookingStatus;
  source: BookingSource;
  notes: string | null;
  cancellationReason: string | null;
  arrivedAt: Date | null;
  matchStartedAt: Date | null;
  matchCompletedAt: Date | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  createdAt: Date;
  updatedAt: Date;
};

export type FinalizeBookingResult =
  | { success: true; booking: BookingRecord }
  | { success: false; code: "slots_unavailable"; message: string }
  | { success: false; code: "session_invalid"; message: string }
  | { success: false; code: "payment_unverified"; message: string }
  | { success: false; code: "finalize_failed"; message: string };
