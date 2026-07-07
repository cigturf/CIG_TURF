"use client";

import { useEffect, useState } from "react";

import type { FinanceTransaction } from "@/features/admin/finance/types/finance.types";
import type { BookingPaymentRecord } from "@/features/admin/bookings/types/admin-booking.types";
import { formatBookingDateLabel } from "@/features/admin/bookings/lib/booking-utils";
import {
  DrawerPanel,
  DrawerRoot,
  Separator,
  Text,
} from "@/components/design-system";
import { formatCurrency } from "@/utils";

type FinanceTransactionDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: FinanceTransaction | null;
};

function formatMethod(method: string) {
  if (method === "online") return "Online (Razorpay)";
  return method.replace(/_/g, " ");
}

export function FinanceTransactionDrawer({
  open,
  onOpenChange,
  transaction,
}: FinanceTransactionDrawerProps) {
  const [history, setHistory] = useState<BookingPaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open || !transaction) {
      setHistory([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    void fetch(`/api/admin/bookings/${transaction.bookingId}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((detail) => {
        if (!cancelled && detail?.payments) {
          setHistory(detail.payments);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, transaction]);

  return (
    <DrawerRoot open={open} onOpenChange={onOpenChange}>
      <DrawerPanel
        title={transaction ? `Payment · ${formatCurrency(transaction.amount)}` : "Payment details"}
        description={transaction?.bookingReference}
        className="max-w-md lg:max-w-lg"
      >
        {!transaction ? (
          <Text className="text-muted-foreground">Select a transaction to view details.</Text>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Booking</span>
                <span className="font-medium">{transaction.bookingReference}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Customer</span>
                <span className="text-right">{transaction.customerName}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Booking date</span>
                <span>
                  {formatBookingDateLabel(transaction.bookingDate)} · {transaction.startTime}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Collection method</span>
                <span className="capitalize">{formatMethod(transaction.method)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Reference</span>
                <span>{transaction.referenceNumber ?? "—"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Collected by</span>
                <span>{transaction.collectedBy ?? "—"}</span>
              </div>
            </div>

            {transaction.notes ? (
              <div>
                <Text size="sm" className="text-muted-foreground mb-1">
                  Notes
                </Text>
                <p className="text-sm">{transaction.notes}</p>
              </div>
            ) : null}

            <Separator />

            <div>
              <Text className="mb-3 font-medium">Payment History</Text>
              {isLoading ? (
                <Text className="text-muted-foreground text-sm">Loading history…</Text>
              ) : history.length === 0 ? (
                <Text className="text-muted-foreground text-sm">No payment history found.</Text>
              ) : (
                <div className="space-y-3">
                  {history.map((payment) => (
                    <div
                      key={payment.id}
                      className="border-border/60 flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium capitalize">{payment.type}</p>
                        <p className="text-muted-foreground text-xs">
                          {new Date(payment.createdAt).toLocaleString("en-IN")} ·{" "}
                          {formatMethod(payment.method)}
                        </p>
                      </div>
                      <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DrawerPanel>
    </DrawerRoot>
  );
}
