"use client";

import { useState } from "react";

import type { AdminBookingDetail } from "@/features/admin/bookings/types/admin-booking.types";
import {
  formatBookingDateLabel,
  formatBookingTimestampFull,
  formatDurationLabel,
} from "@/features/admin/bookings/lib/booking-utils";
import {
  canCollectPayment,
  canCompleteBooking,
  resolveBookingStatusBadge,
  resolvePaymentStatusBadge,
} from "@/features/admin/bookings/lib/booking-status";
import { BookingTimeline } from "@/features/admin/bookings/components/booking-timeline";
import {
  Badge,
  Button,
  DrawerPanel,
  DrawerRoot,
  Separator,
  StatusBadge,
  Text,
} from "@/components/design-system";
import { formatCurrency } from "@/utils";

type BookingDetailDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: AdminBookingDetail | null;
  isLoading: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onDuplicate: () => void;
  onPrint: () => void;
  onCollectPayment: () => void;
  onComplete: () => void;
};

export function BookingDetailDrawer({
  open,
  onOpenChange,
  detail,
  isLoading,
  onEdit,
  onCancel,
  onDuplicate,
  onPrint,
  onCollectPayment,
  onComplete,
}: BookingDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<
    "customer" | "booking" | "payment" | "timeline" | "notes"
  >("booking");

  return (
    <DrawerRoot open={open} onOpenChange={onOpenChange}>
      <DrawerPanel
        title={detail?.bookingReference ?? "Booking details"}
        description={
          detail
            ? `${detail.customerName} · ${formatBookingDateLabel(detail.bookingDate)}`
            : undefined
        }
        className="max-w-md lg:max-w-lg"
      >
        {isLoading || !detail ? (
          <Text className="text-muted-foreground">Loading booking…</Text>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <StatusBadge {...resolveBookingStatusBadge(detail.status)} />
              <StatusBadge {...resolvePaymentStatusBadge(detail.paymentStatus)} />
              <Badge variant="outline">{detail.source === "manual" ? "Manual" : "Online"}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {canCollectPayment(detail.status) && detail.remainingAmount > 0 ? (
                <Button size="sm" variant="outline" onClick={onCollectPayment}>
                  Collect Payment
                </Button>
              ) : null}
              {canCompleteBooking(detail) ? (
                <Button size="sm" variant="outline" onClick={onComplete}>
                  Complete
                </Button>
              ) : null}
              <Button size="sm" variant="outline" onClick={onPrint}>
                Print Receipt
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {(["customer", "booking", "payment", "timeline", "notes"] as const).map((tab) => (
                <Button
                  key={tab}
                  size="sm"
                  variant={activeTab === tab ? "default" : "outline"}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab[0]!.toUpperCase() + tab.slice(1)}
                </Button>
              ))}
            </div>

            {activeTab === "customer" ? (
              <div className="space-y-3">
                <DetailRow label="Name" value={detail.customerName} />
                <DetailRow label="Phone" value={detail.customerPhone} />
                <DetailRow label="Email" value={detail.customerEmail || "—"} />
              </div>
            ) : null}

            {activeTab === "booking" ? (
              <div className="space-y-3">
                <DetailRow label="Date" value={formatBookingDateLabel(detail.bookingDate)} />
                <DetailRow label="Time" value={`${detail.startTime} – ${detail.endTime}`} />
                <DetailRow label="Duration" value={formatDurationLabel(detail.durationMinutes)} />
                <DetailRow label="Slots" value={`${detail.selectedSlots.length} selected`} />
                <DetailRow label="Created" value={formatBookingTimestampFull(detail.createdAt)} />
                {detail.matchCompletedAt ? (
                  <DetailRow
                    label="Completed"
                    value={formatBookingTimestampFull(detail.matchCompletedAt)}
                  />
                ) : null}
              </div>
            ) : null}

            {activeTab === "payment" ? (
              <PaymentSettlementSection detail={detail} onCollectPayment={onCollectPayment} />
            ) : null}

            {activeTab === "timeline" ? <BookingTimeline steps={detail.timeline} /> : null}

            {activeTab === "notes" ? (
              <div className="space-y-3">
                <Text size="sm" className="text-muted-foreground">
                  {detail.notes || "No notes added for this booking."}
                </Text>
                {detail.auditLogs.length > 0 ? (
                  <>
                    <Separator />
                    <Text className="font-medium">Audit Log</Text>
                    <div className="space-y-2">
                      {detail.auditLogs.map((entry) => (
                        <div
                          key={entry.id}
                          className="border-border/70 rounded-[var(--radius-md)] border p-3"
                        >
                          <Text size="sm" className="font-medium capitalize">
                            {entry.action.replace(/\./g, " ")}
                          </Text>
                          <Text size="sm" className="text-muted-foreground mt-1">
                            {formatBookingTimestampFull(entry.createdAt)}
                            {entry.actorEmail ? ` · ${entry.actorEmail}` : ""}
                          </Text>
                          {entry.oldValue || entry.newValue ? (
                            <Text size="sm" className="text-muted-foreground mt-1">
                              {entry.oldValue ?? "—"} → {entry.newValue ?? "—"}
                            </Text>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
                {detail.cancellationReason ? (
                  <div className="border-destructive/30 bg-destructive/5 rounded-[var(--radius-md)] border p-3">
                    <Text size="sm" className="font-medium">
                      Cancellation reason
                    </Text>
                    <Text size="sm" className="text-muted-foreground mt-1">
                      {detail.cancellationReason}
                    </Text>
                  </div>
                ) : null}
              </div>
            ) : null}

            <Separator />

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={onEdit}>
                Edit Amounts
              </Button>
              <Button variant="outline" onClick={onDuplicate}>
                Duplicate
              </Button>
              {detail.status !== "cancelled" && detail.status !== "completed" ? (
                <Button variant="destructive" className="col-span-2" onClick={onCancel}>
                  Cancel Booking
                </Button>
              ) : null}
            </div>
          </div>
        )}
      </DrawerPanel>
    </DrawerRoot>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Text size="sm" className="text-muted-foreground">
        {label}
      </Text>
      <Text className="mt-0.5 font-medium">{value}</Text>
    </div>
  );
}

function SettlementRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2 last:border-b-0 last:pb-0">
      <Text size="sm" className="text-muted-foreground">
        {label}
      </Text>
      <Text size="sm" className={highlight ? "font-semibold text-destructive" : "font-semibold"}>
        {value}
      </Text>
    </div>
  );
}

function PaymentSettlementSection({
  detail,
  onCollectPayment,
}: {
  detail: AdminBookingDetail;
  onCollectPayment: () => void;
}) {
  const advanceAmount = detail.payments
    .filter((payment) => payment.type === "advance")
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="space-y-4">
      <div>
        <Text className="font-semibold">Payment Settlement</Text>
        <Text size="sm" className="text-muted-foreground mt-1">
          Immutable payment history — each collection creates a new record.
        </Text>
      </div>

      <div className="border-border/70 bg-muted/20 rounded-[var(--radius-md)] border p-4">
        <div className="grid grid-cols-1 gap-3">
          <SettlementRow label="Total Booking Amount" value={formatCurrency(detail.totalPrice)} />
          <SettlementRow label="Advance Paid" value={formatCurrency(advanceAmount)} />
          <SettlementRow
            label="Remaining Amount"
            value={formatCurrency(detail.remainingAmount)}
            highlight
          />
        </div>
      </div>

      {detail.remainingAmount > 0 && canCollectPayment(detail.status) ? (
        <Button className="w-full" onClick={onCollectPayment}>
          Collect Remaining Payment
        </Button>
      ) : null}

      <Separator />
      <Text className="font-medium">Payment History</Text>
      <div className="space-y-2">
        {detail.payments.length === 0 ? (
          <Text size="sm" className="text-muted-foreground">
            No payment records yet.
          </Text>
        ) : (
          detail.payments.map((payment) => (
            <div
              key={payment.id}
              className="border-border/70 bg-muted/20 rounded-[var(--radius-md)] border p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <Text size="sm" className="font-medium">
                  {formatCurrency(payment.amount)}
                </Text>
                <Badge variant="outline" className="capitalize">
                  {payment.method.replace(/_/g, " ")}
                </Badge>
              </div>
              <Text size="sm" className="text-muted-foreground mt-1 capitalize">
                {payment.type === "advance" ? "Advance" : "Collected"} ·{" "}
                {formatBookingTimestampFull(payment.createdAt)}
              </Text>
              {payment.referenceNumber ? (
                <Text size="sm" className="text-muted-foreground mt-1">
                  Ref: {payment.referenceNumber}
                </Text>
              ) : null}
              {payment.notes ? (
                <Text size="sm" className="text-muted-foreground mt-1">
                  {payment.notes}
                </Text>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
