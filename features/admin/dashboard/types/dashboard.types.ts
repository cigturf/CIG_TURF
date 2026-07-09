import type { AdminBookingRecord } from "@/features/admin/bookings/types/admin-booking.types";
import type { BookingRecord } from "@/features/booking/types/booking-record.types";

export type DashboardOperationsBooking = AdminBookingRecord;

export type DashboardStats = {
  todaysBookings: number;
  todaysRevenue: number;
  pendingCollections: number;
  availableSlots: number;
  occupiedSlots: number;
  cancelledBookings: number;
};

export type DashboardTimelineItem = {
  id: string;
  slotId: string;
  timeLabel: string;
  kind: "booking" | "available";
  customerName?: string;
  bookingReference?: string;
  bookingStatus?: BookingRecord["status"];
  remainingAmount?: number;
};

export type DashboardUpcomingEvent = {
  id: string;
  title: string;
  type: "tournament" | "league" | "camp" | "offer";
  startDate: string;
  endDate?: string | null;
  configured: boolean;
};

export type DashboardActivity = {
  id: string;
  type:
    | "booking_confirmed"
    | "slot_cancelled"
    | "price_updated"
    | "gallery_updated"
    | "admin_login";
  title: string;
  description: string;
  timestamp: string;
};

export type DashboardOperationsData = {
  currentMatch: DashboardOperationsBooking | null;
  upcomingMatch: DashboardOperationsBooking | null;
  pendingCollections: DashboardOperationsBooking[];
};

export type AdminDashboardData = {
  dateIso: string;
  stats: DashboardStats;
  timeline: DashboardTimelineItem[];
  operations: DashboardOperationsData;
  recentBookings: BookingRecord[];
  upcomingEvents: DashboardUpcomingEvent[];
  activities: DashboardActivity[];
};
