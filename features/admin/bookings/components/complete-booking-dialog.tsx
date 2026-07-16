"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { OfflinePaymentMethod } from "@/features/admin/bookings/types/admin-booking.types";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  Text,
} from "@/components/design-system";
import { formatCurrency } from "@/utils";

type CompleteBookingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remainingAmount: number;
  bookingReference: string;
  onSubmit: (payload: {
    collection?: {
      amount: number;
      method: OfflinePaymentMethod;
      referenceNumber?: string;
      notes?: string;
    };
    overrideOutstanding?: boolean;
    overrideReason?: string;
  }) => Promise<void>;
};

export function CompleteBookingDialog({
  open,
  onOpenChange,
  remainingAmount,
  bookingReference,
  onSubmit,
}: CompleteBookingDialogProps) {
  const [amount, setAmount] = useState(String(remainingAmount));
  const [method, setMethod] = useState<OfflinePaymentMethod>("cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [collectionNotes, setCollectionNotes] = useState("");
  const [overrideEnabled, setOverrideEnabled] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasOutstanding = remainingAmount > 0;
  const parsedAmount = useMemo(() => Number(amount), [amount]);
  const outstandingAfter = Math.max(remainingAmount - (parsedAmount || 0), 0);

  useEffect(() => {
    if (open) {
      setAmount(String(remainingAmount));
      setMethod("cash");
      setReferenceNumber("");
      setCollectionNotes("");
      setOverrideEnabled(false);
      setOverrideReason("");
    }
  }, [open, remainingAmount]);

  const handleSubmit = async () => {
    if (hasOutstanding && !overrideEnabled) {
      if (!parsedAmount || parsedAmount <= 0) {
        toast.error("Enter the amount collected (can be less than outstanding).");
        return;
      }
      if (parsedAmount > remainingAmount) {
        toast.error("Collected amount cannot exceed the outstanding balance.");
        return;
      }
    }

    if (hasOutstanding && overrideEnabled && !overrideReason.trim()) {
      toast.error("Override reason is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        collection:
          hasOutstanding && !overrideEnabled
            ? {
                amount: parsedAmount,
                method,
                referenceNumber: referenceNumber.trim() || undefined,
                notes: collectionNotes.trim() || undefined,
              }
            : undefined,
        overrideOutstanding: hasOutstanding ? overrideEnabled : undefined,
        overrideReason: hasOutstanding && overrideEnabled ? overrideReason.trim() : undefined,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to complete booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Complete Booking</DialogTitle>
          <DialogDescription>
            Mark {bookingReference} as completed. Record any payment received now — partial
            collections are supported.
          </DialogDescription>
        </DialogHeader>

        {hasOutstanding ? (
          <div className="space-y-4">
            <div className="border-border/70 bg-muted/20 grid grid-cols-2 gap-3 rounded-[var(--radius-md)] border p-4">
              <div>
                <Text size="sm" className="text-muted-foreground">
                  Outstanding
                </Text>
                <Text className="mt-1 font-semibold">{formatCurrency(remainingAmount)}</Text>
              </div>
              <div>
                <Text size="sm" className="text-muted-foreground">
                  After Collection
                </Text>
                <Text className="mt-1 font-semibold">{formatCurrency(outstandingAfter)}</Text>
              </div>
            </div>

            {!overrideEnabled ? (
              <div className="space-y-4">
                <FormField label="Amount Collected">
                  <FormInput
                    type="number"
                    min={1}
                    max={remainingAmount}
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />
                </FormField>

                <FormField label="Payment Method">
                  <FormSelect
                    value={method}
                    onChange={(event) => setMethod(event.target.value as OfflinePaymentMethod)}
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="other">Other</option>
                  </FormSelect>
                </FormField>

                <FormField label="Reference Number (optional)">
                  <FormInput
                    value={referenceNumber}
                    onChange={(event) => setReferenceNumber(event.target.value)}
                    placeholder="UPI ref, receipt no., etc."
                  />
                </FormField>

                <FormField label="Notes (optional)">
                  <FormTextarea
                    value={collectionNotes}
                    onChange={(event) => setCollectionNotes(event.target.value)}
                    rows={2}
                  />
                </FormField>
              </div>
            ) : null}

            <label className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border p-4">
              <div>
                <Text className="font-medium">Complete without collecting (owner override)</Text>
                <Text size="sm" className="text-muted-foreground mt-1">
                  Use when no payment was received. Logs override reason in the audit trail.
                </Text>
              </div>
              <input
                type="checkbox"
                checked={overrideEnabled}
                onChange={(event) => setOverrideEnabled(event.target.checked)}
                className="size-4"
              />
            </label>

            {overrideEnabled ? (
              <FormField label="Override Reason">
                <FormTextarea
                  value={overrideReason}
                  onChange={(event) => setOverrideReason(event.target.value)}
                  rows={3}
                  placeholder="Why is this booking being completed with outstanding payment?"
                />
              </FormField>
            ) : null}

            {outstandingAfter > 0 && !overrideEnabled ? (
              <Text size="sm" className="text-muted-foreground">
                Partial payments are recorded in finance. The booking can still be completed with{" "}
                {formatCurrency(outstandingAfter)} outstanding, or use owner override if nothing
                was collected.
              </Text>
            ) : null}
          </div>
        ) : (
          <Text size="sm" className="text-muted-foreground">
            Payment is fully settled. Completing will mark the booking as finished.
          </Text>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button loading={isSubmitting} onClick={() => void handleSubmit()}>
            Complete Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
