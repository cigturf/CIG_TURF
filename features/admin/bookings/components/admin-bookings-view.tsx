"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState, type ComponentProps } from "react";
import { CalendarDays } from "lucide-react";
import { toast } from "sonner";

import { AdminBookingsSlotOverview } from "@/features/admin/bookings/components/admin-bookings-slot-overview";
import { BookingMobileCard } from "@/features/admin/bookings/components/booking-mobile-card";
import { BookingsFilterBar } from "@/features/admin/bookings/components/bookings-filter-bar";
import { BookingsTable } from "@/features/admin/bookings/components/bookings-table";
import { resolveSlotViewDate } from "@/features/admin/bookings/lib/booking-filters";
import { useAdminBookings } from "@/features/admin/bookings/providers/bookings-realtime-provider";
import type {
  AdminBookingRecord,
  OfflinePaymentMethod,
} from "@/features/admin/bookings/types/admin-booking.types";
import { RealtimeStatusIndicator } from "@/features/realtime/components/realtime-status-indicator";
import { AnalyticsCard, EmptyState, Heading, Text } from "@/components/design-system";

const BookingDetailDrawer = dynamic(
  () =>
    import("@/features/admin/bookings/components/booking-detail-drawer").then(
      (module) => module.BookingDetailDrawer,
    ),
  { ssr: false },
);

const ManualBookingDialog = dynamic(
  () =>
    import("@/features/admin/bookings/components/manual-booking-dialog").then(
      (module) => module.ManualBookingDialog,
    ),
  { ssr: false },
);

const EditBookingDialog = dynamic(
  () =>
    import("@/features/admin/bookings/components/edit-booking-dialog").then(
      (module) => module.EditBookingDialog,
    ),
  { ssr: false },
);

const CancelBookingDialog = dynamic(
  () =>
    import("@/features/admin/bookings/components/cancel-booking-dialog").then(
      (module) => module.CancelBookingDialog,
    ),
  { ssr: false },
);

const CollectPaymentDialog = dynamic(
  () =>
    import("@/features/admin/bookings/components/collect-payment-dialog").then(
      (module) => module.CollectPaymentDialog,
    ),
  { ssr: false },
);

const CompleteBookingDialog = dynamic(
  () =>
    import("@/features/admin/bookings/components/complete-booking-dialog").then(
      (module) => module.CompleteBookingDialog,
    ),
  { ssr: false },
);

function buildExportUrl(format: "csv" | "xlsx" | "pdf", query: ReturnType<typeof useAdminBookings>["query"]) {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.dateFilter) params.set("dateFilter", query.dateFilter);
  if (query.customDate) params.set("customDate", query.customDate);
  if (query.sort) params.set("sort", query.sort);
  query.status?.forEach((value) => params.append("status", value));
  query.source?.forEach((value) => params.append("source", value));
  params.set("format", format);
  return `/api/admin/bookings/export?${params.toString()}`;
}

export function AdminBookingsView() {
  const {
    bookings,
    total,
    isRefreshing,
    query,
    setQuery,
    selectedBookingId,
    setSelectedBookingId,
    selectedDetail,
    isDetailLoading,
    refresh,
    refreshDetail,
  } = useAdminBookings();

  const [manualOpen, setManualOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [collectOpen, setCollectOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);

  const slotViewDate = useMemo(() => resolveSlotViewDate(query), [query]);

  const handleSlotDateChange = useCallback(
    (dateIso: string) => {
      setQuery({
        ...query,
        dateFilter: "custom",
        customDate: dateIso,
      });
    },
    [query, setQuery],
  );

  const selectedBooking = useMemo(
    () => bookings.find((booking) => booking.id === selectedBookingId) ?? selectedDetail,
    [bookings, selectedBookingId, selectedDetail],
  );

  const duplicateBooking = useCallback(async (id: string) => {
    const response = await fetch(`/api/admin/bookings/${id}/duplicate`, { method: "POST" });
    if (!response.ok) {
      toast.error("Failed to duplicate booking");
      return;
    }
    const booking = await response.json();
    toast.success(`Duplicated as ${booking.bookingReference}`);
    await refresh();
    setSelectedBookingId(booking.id);
  }, [refresh, setSelectedBookingId]);

  const handleAction = useCallback(
    (action: "view" | "edit" | "cancel" | "duplicate" | "print", booking: AdminBookingRecord) => {
      setSelectedBookingId(booking.id);
      if (action === "edit") setEditOpen(true);
      if (action === "cancel") setCancelOpen(true);
      if (action === "print") window.open(`/api/admin/bookings/${booking.id}/receipt`, "_blank");
      if (action === "duplicate") void duplicateBooking(booking.id);
    },
    [duplicateBooking, setSelectedBookingId],
  );

  const createManualBooking = async (
    payload: ComponentProps<typeof ManualBookingDialog>["onSubmit"] extends (
      value: infer P,
    ) => Promise<void>
      ? P
      : never,
  ) => {
    const response = await fetch("/api/admin/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error ?? "Failed to create booking");
    }
    const booking = await response.json();
    await refresh();
    setSelectedBookingId(booking.id);
  };

  const updateBooking = async (payload: {
    customerName: string;
    customerPhone?: string;
    customerEmail: string;
    notes?: string;
    totalPrice: number;
  }) => {
    if (!selectedBookingId) return;
    const response = await fetch(`/api/admin/bookings/${selectedBookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Failed to update booking");
    await refresh();
    await refreshDetail();
  };

  const cancelBooking = async (payload: { reason: string; initiateRefund: boolean }) => {
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
    toast.success(
      payload.initiateRefund ? "Booking cancelled and refund initiated" : "Booking cancelled",
    );
    await refresh();
    await refreshDetail();
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
    await refresh();
    await refreshDetail();
    window.open(`/api/admin/bookings/${selectedBookingId}/receipt`, "_blank");
  };

  const completeBooking = async (payload: {
    overrideOutstanding?: boolean;
    overrideReason?: string;
  }) => {
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
    toast.success("Booking marked completed");
    await refresh();
    await refreshDetail();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Heading level="h1">Bookings</Heading>
          <Text className="text-muted-foreground mt-1">
            Premium booking management with live updates across dashboard, slots, and notifications.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          {isRefreshing ? (
            <Text size="sm" className="text-muted-foreground">
              Updating…
            </Text>
          ) : null}
          <RealtimeStatusIndicator />
        </div>
      </div>

      <BookingsFilterBar
        query={query}
        onChange={setQuery}
        onManualBooking={() => setManualOpen(true)}
        onExport={(format) => {
          window.open(buildExportUrl(format, query), "_blank");
        }}
      />

      <AdminBookingsSlotOverview
        slotDate={slotViewDate}
        onSlotDateChange={handleSlotDateChange}
        onSelectBooking={setSelectedBookingId}
      />

      <AnalyticsCard
        title="All Bookings"
        description={`${total} booking${total === 1 ? "" : "s"} matching current filters`}
      >
        {bookings.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No bookings found"
            description="Adjust filters or create a manual booking to get started."
          />
        ) : (
          <>
            <BookingsTable
              bookings={bookings}
              onSelect={setSelectedBookingId}
              onAction={handleAction}
            />
            <div className="space-y-3 lg:hidden">
              {bookings.map((booking) => (
                <BookingMobileCard
                  key={booking.id}
                  booking={booking}
                  onSelect={setSelectedBookingId}
                  onQuickAction={(action, id) => {
                    setSelectedBookingId(id);
                    if (action === "collect") setCollectOpen(true);
                    if (action === "complete") setCompleteOpen(true);
                    if (action === "print") window.open(`/api/admin/bookings/${id}/receipt`, "_blank");
                  }}
                />
              ))}
            </div>
          </>
        )}
      </AnalyticsCard>

      <BookingDetailDrawer
        open={Boolean(selectedBookingId)}
        onOpenChange={(open) => {
          if (!open) setSelectedBookingId(null);
        }}
        detail={selectedDetail}
        isLoading={isDetailLoading}
        onEdit={() => setEditOpen(true)}
        onCancel={() => setCancelOpen(true)}
        onDuplicate={() => {
          if (selectedBookingId) void duplicateBooking(selectedBookingId);
        }}
        onPrint={() => {
          if (selectedBookingId) {
            window.open(`/api/admin/bookings/${selectedBookingId}/receipt`, "_blank");
          }
        }}
        onCollectPayment={() => setCollectOpen(true)}
        onComplete={() => setCompleteOpen(true)}
      />

      <ManualBookingDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        defaultDateIso={slotViewDate}
        onSubmit={createManualBooking}
      />

      <EditBookingDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        booking={selectedDetail}
        onSubmit={updateBooking}
      />

      <CancelBookingDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        bookingReference={selectedBooking?.bookingReference ?? "this booking"}
        source={selectedDetail?.source}
        advancePaid={selectedDetail?.advancePaid ?? 0}
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
