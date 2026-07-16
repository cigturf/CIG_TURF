import type { BookingRecord } from "@/features/booking/types/booking-record.types";

export type BookingSource = "online" | "manual";

export type BookingPaymentStatus = "paid" | "pending" | "partial" | "refunded";

export type OfflinePaymentMethod = "cash" | "upi" | "card" | "bank_transfer" | "other" | "online";

export type BookingPaymentRecordType = "advance" | "remaining" | "refund" | "adjustment";

export type BookingPaymentRecord = {
  id: string;
  bookingId: string;
  type: BookingPaymentRecordType;
  amount: number;
  method: OfflinePaymentMethod;
  collectedBy: string | null;
  notes: string | null;
  referenceNumber: string | null;
  createdAt: Date;
};

export type BookingAuditLog = {
  id: string;
  bookingId: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

export type AdminBookingRecord = BookingRecord & {
  source: BookingSource;
  notes: string | null;
  cancellationReason: string | null;
  paymentStatus: BookingPaymentStatus;
};

export type BookingTimelineStepStatus = "completed" | "current" | "upcoming" | "skipped";

export type BookingTimelineStep = {
  id: string;
  label: string;
  description?: string;
  timestamp?: string;
  status: BookingTimelineStepStatus;
};

export type AdminBookingDetail = AdminBookingRecord & {
  payments: BookingPaymentRecord[];
  timeline: BookingTimelineStep[];
  auditLogs: BookingAuditLog[];
};

export type BookingDateFilter = "today" | "tomorrow" | "week" | "custom";

export type BookingStatusFilter =
  | "confirmed"
  | "arrived"
  | "in_progress"
  | "cancelled"
  | "completed"
  | "pending_payment";

export type BookingSourceFilter = "manual" | "online";

export type BookingSortField = "newest" | "oldest" | "time" | "amount" | "customer";

export type AdminBookingListQuery = {
  search?: string;
  dateFilter?: BookingDateFilter;
  customDate?: string;
  status?: BookingStatusFilter[];
  source?: BookingSourceFilter[];
  sort?: BookingSortField;
};

export type AdminBookingListResponse = {
  bookings: AdminBookingRecord[];
  total: number;
};

export type CreateManualBookingInput = {
  bookingDate: string;
  selectedSlots: string[];
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  totalPrice: number;
  advancePaid: number;
  remainingAmount: number;
  advanceMethod?: OfflinePaymentMethod;
  notes?: string;
};

export type UpdateBookingInput = {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  notes?: string;
  totalPrice?: number;
  advancePaid?: number;
};

export type CollectPaymentInput = {
  amount: number;
  method: OfflinePaymentMethod;
  referenceNumber?: string;
  notes?: string;
};

export type CompleteBookingInput = {
  collection?: CollectPaymentInput;
  overrideOutstanding?: boolean;
  overrideReason?: string;
};

export type CancelBookingInput = {
  reason: string;
  initiateRefund?: boolean;
};
