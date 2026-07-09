"use client";

import { useCallback, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";

import { AdminSlotGrid } from "@/features/admin/slots/components/admin-slot-grid";
import { SlotBulkBlockDialog } from "@/features/admin/slots/components/slot-bulk-block-dialog";
import { SlotHolidayDialog } from "@/features/admin/slots/components/slot-holiday-dialog";
import { useSlotDateBookings } from "@/features/admin/bookings/hooks/use-slot-date-bookings";
import { normalizeAdminBookingDetail } from "@/features/admin/bookings/lib/booking-utils";
import type {
  AdminBookingDetail,
  AdminBookingRecord,
  OfflinePaymentMethod,
} from "@/features/admin/bookings/types/admin-booking.types";
import { BookingDetailDrawer } from "@/features/admin/bookings/components/booking-detail-drawer";
import { CancelBookingDialog } from "@/features/admin/bookings/components/cancel-booking-dialog";
import { CollectPaymentDialog } from "@/features/admin/bookings/components/collect-payment-dialog";
import { CompleteBookingDialog } from "@/features/admin/bookings/components/complete-booking-dialog";
import { ManualBookingDialog } from "@/features/admin/bookings/components/manual-booking-dialog";
import {
  generateSlots,
  resolveBookingEngineConfig,
} from "@/features/booking/services";
import { getTodayIso, addDaysToIsoDate } from "@/features/booking/utils/time";
import { useRealtimeSlots } from "@/features/realtime/hooks/use-realtime-slots";
import { useRealtimePricing } from "@/features/pricing/hooks/use-realtime-pricing";
import { AnalyticsCard, Badge, Button, Heading, Input, Text } from "@/components/design-system";
import { useConfigContext } from "@/components/providers/config-provider";

type ManualBookingPayload = {
  bookingDate: string;
  selectedSlots: string[];
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  totalPrice: number;
  advancePaid: number;
  remainingAmount: number;
  notes?: string;
};

function clampDateToWindow(dateIso: string, windowDays: number) {
  const today = getTodayIso();
  const end = addDaysToIsoDate(today, Math.max(windowDays - 1, 0));
  if (dateIso < today) return today;
  if (dateIso > end) return end;
  return dateIso;
}

export function AdminSlotsView() {
  const { publicSettings } = useConfigContext();
  const config = useMemo(() => resolveBookingEngineConfig(publicSettings), [publicSettings]);

  const today = getTodayIso();
  const [dateIso, setDateIso] = useState(() => today);
  const activeDate = useMemo(
    () => clampDateToWindow(dateIso, config.bookingWindowDays),
    [dateIso, config.bookingWindowDays],
  );

  const { bookedSlotIds, heldSlotIds, blockedSlotIds, maintenanceSlotIds, isHoliday, hydrated } =
    useRealtimeSlots(activeDate);
  const { snapshot: pricingSnapshot } = useRealtimePricing();

  const { bookingBySlotId } = useSlotDateBookings(activeDate);

  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [quickFilter, setQuickFilter] = useState<
    "all" | "available" | "booked" | "reserved" | "blocked" | "maintenance"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [holidayDialogOpen, setHolidayDialogOpen] = useState(false);

  const [manualOpen, setManualOpen] = useState(false);
  const [manualInitialSlotId, setManualInitialSlotId] = useState<string | null>(null);

  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<AdminBookingDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [collectOpen, setCollectOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);

  const slots = useMemo(() => {
    return generateSlots({
      dateIso: activeDate,
      config,
      now: new Date(),
      selectedSlotIds: [],
      bookedSlotIds: new Set(bookedSlotIds),
      heldSlotIds: new Set(heldSlotIds),
      blockedSlotIds: new Set(blockedSlotIds),
      maintenanceSlotIds: new Set(maintenanceSlotIds),
      isHoliday,
      pricing: pricingSnapshot,
    });
  }, [activeDate, config, bookedSlotIds, heldSlotIds, blockedSlotIds, maintenanceSlotIds, isHoliday, pricingSnapshot]);

  const filteredSlots = useMemo(() => {
    if (quickFilter === "all") return slots;
    return slots.filter((slot) => slot.status === quickFilter);
  }, [slots, quickFilter]);

  const handleDateNav = (direction: -1 | 1) => {
    setSelectedSlotIds([]);
    setDateIso((current) => addDaysToIsoDate(clampDateToWindow(current, config.bookingWindowDays), direction));
  };

  const openBooking = useCallback(async (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setIsDetailLoading(true);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load booking");
      const detail = (await response.json()) as AdminBookingDetail;
      setSelectedDetail(
        normalizeAdminBookingDetail(
          detail as AdminBookingDetail & {
            createdAt: Date | string;
            updatedAt: Date | string;
            payments: Array<{ createdAt: Date | string }>;
          },
        ),
      );
    } catch {
      setSelectedDetail(null);
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  const releasePaymentHold = async (slotId: string) => {
    const response = await fetch("/api/admin/slots/holds", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotIds: [slotId] }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error ?? "Failed to release hold");
    }
    const data = (await response.json()) as { releasedSlotIds?: string[] };
    if (!data.releasedSlotIds?.length) {
      toast.message("No active payment hold on this slot");
      return;
    }
    toast.success("Payment hold released");
  };

  const handleSlotPress = (slotId: string, status: string) => {
    if (status === "booked") {
      const booking = bookingBySlotId.get(slotId);
      if (booking) void openBooking(booking.id);
      return;
    }

    if (status === "reserved") {
      void releasePaymentHold(slotId).catch((error) => {
        toast.error(error instanceof Error ? error.message : "Failed to release hold");
      });
      return;
    }

    if (status === "available") {
      setManualInitialSlotId(slotId);
      setManualOpen(true);
      return;
    }

    // select for bulk actions
    setSelectedSlotIds((current) =>
      current.includes(slotId) ? current.filter((id) => id !== slotId) : [...current, slotId],
    );
  };

  const runSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    const response = await fetch(`/api/admin/bookings/search?q=${encodeURIComponent(q)}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      toast.error("Search failed");
      return;
    }
    const data = (await response.json()) as { bookings: AdminBookingRecord[] };
    const match = data.bookings[0];
    if (!match) {
      toast.message("No booking found");
      return;
    }
    setDateIso(match.bookingDate);
    toast.success(`Jumped to ${match.bookingReference}`);
  };

  const createManualBooking = async (payload: ManualBookingPayload) => {
    const response = await fetch("/api/admin/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error ?? "Failed to create booking");
    }
    const booking = (await response.json()) as AdminBookingDetail;
    toast.success("Manual booking created");
    await openBooking(booking.id);
  };

  const cancelBooking = async (payload: { reason: string; issueRefund: boolean }) => {
    if (!selectedBookingId) return;
    const response = await fetch(`/api/admin/bookings/${selectedBookingId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error ?? "Failed to cancel booking");
    }
    toast.success(payload.issueRefund ? "Booking cancelled and refund initiated" : "Booking cancelled");
    await openBooking(selectedBookingId);
  };

  const collectPayment = async (payload: {
    amount: number;
    method: OfflinePaymentMethod;
    referenceNumber?: string;
    notes?: string;
  }) => {
    if (!selectedBookingId) return;
    const response = await fetch(`/api/admin/bookings/${selectedBookingId}/collect-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error ?? "Failed to collect payment");
    }
    toast.success("Payment collected");
    window.open(`/api/admin/bookings/${selectedBookingId}/receipt`, "_blank");
    await openBooking(selectedBookingId);
  };

  const completeBooking = async (payload: { overrideOutstanding?: boolean; overrideReason?: string }) => {
    if (!selectedBookingId) return;
    const response = await fetch(`/api/admin/bookings/${selectedBookingId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error ?? "Failed to complete booking");
    }
    toast.success("Booking completed");
    await openBooking(selectedBookingId);
  };

  const markArrived = async () => {
    if (!selectedBookingId) return;
    const response = await fetch(`/api/admin/bookings/${selectedBookingId}/arrive`, { method: "POST" });
    if (!response.ok) throw new Error("Failed to mark arrived");
    toast.success("Marked arrived");
    await openBooking(selectedBookingId);
  };

  const startMatch = async () => {
    if (!selectedBookingId) return;
    const response = await fetch(`/api/admin/bookings/${selectedBookingId}/start`, { method: "POST" });
    if (!response.ok) throw new Error("Failed to start match");
    toast.success("Match started");
    await openBooking(selectedBookingId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Heading level="h1">Slots</Heading>
          <Text className="text-muted-foreground mt-1">
            Smart slot management — block, maintain, holiday, and operate bookings from the timeline.
          </Text>
        </div>
      </div>

      <AnalyticsCard
        title="Filters"
        description="Navigate dates quickly and filter by slot state."
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => handleDateNav(-1)}>
              Previous
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDateIso(today)}>
              Today
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleDateNav(1)}>
              Next
            </Button>
            <Input
              type="date"
              value={activeDate}
              min={today}
              max={addDaysToIsoDate(today, config.bookingWindowDays - 1)}
              onChange={(event) => setDateIso(event.target.value)}
              className="h-9 w-[160px]"
            />
            <Button size="sm" variant="outline" onClick={() => setHolidayDialogOpen(true)}>
              Holiday
            </Button>
            {isHoliday ? <Badge variant="destructive">Holiday</Badge> : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search booking ref, name, phone…"
                className="h-9 w-[260px] pl-10"
              />
            </div>
            <Button size="sm" variant="outline" onClick={() => void runSearch()}>
              Jump
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Text size="sm" className="text-muted-foreground mr-1">
            Quick filters
          </Text>
          {(
            [
              ["all", "All"],
              ["available", "Available"],
              ["booked", "Booked"],
              ["reserved", "Payment hold"],
              ["blocked", "Blocked"],
              ["maintenance", "Maintenance"],
            ] as const
          ).map(([key, label]) => (
            <Button
              key={key}
              size="sm"
              variant={quickFilter === key ? "default" : "outline"}
              onClick={() => setQuickFilter(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      </AnalyticsCard>

      <AdminSlotGrid
        dateIso={activeDate}
        slots={filteredSlots}
        hydrated={hydrated}
        selectedSlotIds={selectedSlotIds}
        bookingBySlotId={bookingBySlotId}
        onSlotPress={handleSlotPress}
        onClearSelection={() => setSelectedSlotIds([])}
        onBulkAction={() => setBlockDialogOpen(true)}
      />

      <SlotBulkBlockDialog
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
        activeDate={activeDate}
        selectedSlotIds={selectedSlotIds}
        onDone={() => setSelectedSlotIds([])}
      />

      <SlotHolidayDialog
        open={holidayDialogOpen}
        onOpenChange={setHolidayDialogOpen}
        activeDate={activeDate}
        isHoliday={isHoliday}
      />

      <ManualBookingDialog
        open={manualOpen}
        onOpenChange={(open) => {
          setManualOpen(open);
          if (!open) setManualInitialSlotId(null);
        }}
        defaultDateIso={activeDate}
        initialSelectedSlotIds={manualInitialSlotId ? [manualInitialSlotId] : undefined}
        onSubmit={createManualBooking}
      />

      <BookingDetailDrawer
        open={Boolean(selectedBookingId)}
        onOpenChange={(open) => {
          if (!open) setSelectedBookingId(null);
        }}
        detail={selectedDetail}
        isLoading={isDetailLoading}
        onEdit={() => toast.message("Edit is available in Bookings module")}
        onCancel={() => setCancelOpen(true)}
        onDuplicate={() => toast.message("Duplicate is available in Bookings module")}
        onPrint={() => {
          if (selectedBookingId) window.open(`/api/admin/bookings/${selectedBookingId}/receipt`, "_blank");
        }}
        onCollectPayment={() => setCollectOpen(true)}
        onComplete={() => setCompleteOpen(true)}
        onMarkArrived={() => void markArrived()}
        onStartMatch={() => void startMatch()}
      />

      <CancelBookingDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        bookingReference={selectedDetail?.bookingReference ?? "this booking"}
        refundableAmount={
          selectedDetail?.source === "online" && selectedDetail.advancePaid > 0
            ? selectedDetail.advancePaid
            : 0
        }
        onSubmit={cancelBooking}
      />

      <CollectPaymentDialog
        open={collectOpen}
        onOpenChange={setCollectOpen}
        remainingAmount={selectedDetail?.remainingAmount ?? 0}
        onSubmit={collectPayment}
      />

      <CompleteBookingDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        remainingAmount={selectedDetail?.remainingAmount ?? 0}
        bookingReference={selectedDetail?.bookingReference ?? "this booking"}
        onSubmit={completeBooking}
      />
    </div>
  );
}

