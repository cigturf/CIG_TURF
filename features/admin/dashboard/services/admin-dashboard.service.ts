import { cache } from "react";

import type {
  AdminDashboardData,
  DashboardActivity,
  DashboardStats,
  DashboardTimelineItem,
  DashboardUpcomingEvent,
} from "@/features/admin/dashboard/types/dashboard.types";
import { buildDashboardOperations } from "@/features/admin/bookings/services/booking-operations.service";
import { createEmptyBusinessSettings } from "@/features/business-settings/lib/defaults";
import { toPublicBusinessSettings } from "@/features/business-settings/lib/parse";
import { resolveBookingEngineConfig } from "@/features/booking/services/booking-config.service";
import { getBookedSlotIdsForDate } from "@/features/booking/services/booked-slot.repository";
import {
  listBookingsForDate,
  listRecentBookings,
} from "@/features/booking/services/booking.repository";
import { generateSlots } from "@/features/booking/services/slot-generator.service";
import type { BookingRecord } from "@/features/booking/types/booking-record.types";
import { getTodayIsoInTimezone } from "@/features/booking/utils/venue-timezone";
import { buildPricingSnapshot } from "@/features/pricing/services/pricing-engine.service";
import { listActivePricingRules } from "@/features/pricing/services/pricing.repository";
import { SettingsService } from "@/server/settings";

const PLACEHOLDER_EVENTS: DashboardUpcomingEvent[] = [
  {
    id: "placeholder-tournament",
    title: "Weekend Cricket Tournament",
    type: "tournament",
    startDate: "2026-07-12",
    endDate: "2026-07-13",
    configured: false,
  },
  {
    id: "placeholder-league",
    title: "Corporate Box Cricket League",
    type: "league",
    startDate: "2026-07-18",
    configured: false,
  },
  {
    id: "placeholder-camp",
    title: "Junior Batting Practice Camp",
    type: "camp",
    startDate: "2026-07-20",
    endDate: "2026-07-22",
    configured: false,
  },
  {
    id: "placeholder-offer",
    title: "Monsoon Slot Special — 15% Off",
    type: "offer",
    startDate: "2026-07-25",
    configured: false,
  },
];

function computeStats(bookings: BookingRecord[], slots: ReturnType<typeof generateSlots>): DashboardStats {
  const activeBookings = bookings.filter((booking) => booking.status !== "cancelled");
  const cancelledBookings = bookings.filter((booking) => booking.status === "cancelled").length;

  return {
    todaysBookings: activeBookings.length,
    todaysRevenue: activeBookings.reduce((sum, booking) => sum + booking.advancePaid, 0),
    pendingCollections: activeBookings.reduce((sum, booking) => sum + booking.remainingAmount, 0),
    availableSlots: slots.filter((slot) => slot.status === "available").length,
    occupiedSlots: slots.filter((slot) => slot.status === "booked").length,
    cancelledBookings,
  };
}

function buildTimeline(
  slots: ReturnType<typeof generateSlots>,
  bookings: BookingRecord[],
): DashboardTimelineItem[] {
  const bookingBySlotId = new Map<string, BookingRecord>();

  for (const booking of bookings) {
    for (const slotId of booking.selectedSlots) {
      bookingBySlotId.set(slotId, booking);
    }
  }

  const items: DashboardTimelineItem[] = [];

  for (const slot of slots) {
    if (slot.status === "past") continue;

    const booking = bookingBySlotId.get(slot.id);

    if (booking && booking.status !== "cancelled") {
      items.push({
        id: slot.id,
        slotId: slot.id,
        timeLabel: slot.timeLabel,
        kind: "booking",
        customerName: booking.customerName,
        bookingReference: booking.bookingReference,
        bookingStatus: booking.status,
        remainingAmount: booking.remainingAmount,
      });
      continue;
    }

    if (slot.status === "available") {
      items.push({
        id: slot.id,
        slotId: slot.id,
        timeLabel: slot.timeLabel,
        kind: "available",
      });
    }
  }

  return items;
}

function inferEventType(title: string): DashboardUpcomingEvent["type"] {
  const normalized = title.toLowerCase();
  if (normalized.includes("tournament")) return "tournament";
  if (normalized.includes("league")) return "league";
  if (normalized.includes("camp")) return "camp";
  return "offer";
}

function resolveUpcomingEvents(): DashboardUpcomingEvent[] {
  return PLACEHOLDER_EVENTS;
}

async function resolveUpcomingEventsFromSettings(): Promise<DashboardUpcomingEvent[]> {
  const settings =
    (await SettingsService.getPublic()) ?? toPublicBusinessSettings(createEmptyBusinessSettings());
  const config = resolveBookingEngineConfig(settings);
  const events = settings.content.events ?? [];
  const today = getTodayIsoInTimezone(new Date(), config.timezone);

  const configured = events
    .filter((event) => event.visible !== false && event.title && event.startDate)
    .filter((event) => (event.startDate as string) >= today)
    .sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)))
    .slice(0, 4)
    .map((event) => ({
      id: event.id,
      title: event.title as string,
      type: inferEventType(event.title as string),
      startDate: event.startDate as string,
      endDate: event.endDate,
      configured: true,
    }));

  if (configured.length === 0) {
    return resolveUpcomingEvents();
  }

  return configured;
}

function buildActivities(
  recentBookings: BookingRecord[],
  dateIso: string,
): DashboardActivity[] {
  const bookingActivities: DashboardActivity[] = recentBookings.slice(0, 4).map((booking) => ({
    id: `activity-booking-${booking.id}`,
    type: "booking_confirmed",
    title: "Booking confirmed",
    description: `${booking.customerName} · ${booking.bookingReference}`,
    timestamp: booking.createdAt.toISOString(),
  }));

  const seedActivities: DashboardActivity[] = [
    {
      id: "activity-slot-cancelled",
      type: "slot_cancelled",
      title: "Slot cancelled",
      description: "Evening block released for walk-in availability.",
      timestamp: new Date(`${dateIso}T08:30:00`).toISOString(),
    },
    {
      id: "activity-price-updated",
      type: "price_updated",
      title: "Price updated",
      description: "Weekend peak-hour pricing adjusted.",
      timestamp: new Date(`${dateIso}T07:15:00`).toISOString(),
    },
    {
      id: "activity-gallery-updated",
      type: "gallery_updated",
      title: "Gallery updated",
      description: "New facility photos queued for review.",
      timestamp: new Date(`${dateIso}T06:45:00`).toISOString(),
    },
    {
      id: "activity-admin-login",
      type: "admin_login",
      title: "Admin login",
      description: "Operations console accessed.",
      timestamp: new Date().toISOString(),
    },
  ];

  return [...bookingActivities, ...seedActivities]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 8);
}

export const getAdminDashboardData = cache(async (): Promise<AdminDashboardData> => {
  const settings =
    (await SettingsService.getPublic()) ?? toPublicBusinessSettings(createEmptyBusinessSettings());
  const config = resolveBookingEngineConfig(settings);
  const now = new Date();
  const dateIso = getTodayIsoInTimezone(now, config.timezone);
  const bookedSlotIds = await getBookedSlotIdsForDate(dateIso);
  const pricingSnapshot = buildPricingSnapshot(await listActivePricingRules());
  const slots = generateSlots({ dateIso, config, bookedSlotIds, pricing: pricingSnapshot });
  const todaysBookings = await listBookingsForDate(dateIso);
  const recentBookings = await listRecentBookings(10);
  const upcomingEvents = await resolveUpcomingEventsFromSettings();

  return {
    dateIso,
    stats: computeStats(todaysBookings, slots),
    timeline: buildTimeline(slots, todaysBookings),
    operations: buildDashboardOperations(todaysBookings, {
      now,
      timezone: config.timezone,
    }),
    recentBookings,
    upcomingEvents,
    activities: buildActivities(recentBookings, dateIso),
  };
});
