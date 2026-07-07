import type { AdminBookingRecord } from "@/features/admin/bookings/types/admin-booking.types";
import type { BookingPaymentRecord } from "@/features/admin/bookings/types/admin-booking.types";

export type CustomerFilter = "all" | "repeat" | "new" | "pending" | "most_active";

export type CustomerStatus = "new" | "repeat" | "pending" | "active";

export type CustomerListItem = {
  customerKey: string;
  name: string;
  phone: string;
  email: string;
  totalBookings: number;
  lastBookingDate: string | null;
  totalAmountSpent: number;
  outstandingAmount: number;
  status: CustomerStatus;
  latestBookingId: string | null;
};

export type CustomerBookingHistoryItem = {
  id: string;
  bookingReference: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  slotsLabel: string;
  amount: number;
  status: AdminBookingRecord["status"];
};

export type CustomerPaymentHistoryItem = {
  id: string;
  bookingReference: string;
  type: BookingPaymentRecord["type"];
  amount: number;
  method: BookingPaymentRecord["method"];
  createdAt: string;
  label: string;
};

export type CustomerProfile = CustomerListItem & {
  bookings: CustomerBookingHistoryItem[];
  payments: CustomerPaymentHistoryItem[];
  ownerNotes: string | null;
};

export type CustomerDirectoryData = {
  customers: CustomerListItem[];
  total: number;
  generatedAt: string;
};

export type CustomerDirectoryQuery = {
  search?: string;
  filter?: CustomerFilter;
};
