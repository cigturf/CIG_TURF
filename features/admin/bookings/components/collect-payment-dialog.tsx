"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { OfflinePaymentMethod } from "@/features/admin/bookings/types/admin-booking.types";
import { formatBookingTimestampFull } from "@/features/admin/bookings/lib/booking-utils";
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

type CollectPaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remainingAmount: number;
  collectedByLabel?: string;
  onSubmit: (payload: {
    amount: number;
    method: OfflinePaymentMethod;
    referenceNumber?: string;
    notes?: string;
  }) => Promise<void>;
};

export function CollectPaymentDialog({
  open,
  onOpenChange,
  remainingAmount,
  collectedByLabel,
  onSubmit,
}: CollectPaymentDialogProps) {
  const [amount, setAmount] = useState(String(remainingAmount));
  const [method, setMethod] = useState<OfflinePaymentMethod>("cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(String(remainingAmount));
      setMethod("cash");
      setReferenceNumber("");
      setNotes("");
    }
  }, [open, remainingAmount]);

  const parsedAmount = useMemo(() => Number(amount), [amount]);
  const outstandingAfter = Math.max(remainingAmount - (parsedAmount || 0), 0);

  const handleSubmit = async () => {
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    if (parsedAmount > remainingAmount) {
      toast.error("Amount cannot exceed the outstanding balance.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        amount: parsedAmount,
        method,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to collect payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Collect Remaining Payment</DialogTitle>
          <DialogDescription>
            Record what the customer actually paid. Enter less than outstanding for partial
            collections — only the amount entered is added to finance totals.
          </DialogDescription>
        </DialogHeader>

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
            <FormTextarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Text size="sm" className="text-muted-foreground">
                Collected By
              </Text>
              <Text size="sm" className="mt-1 font-medium">
                {collectedByLabel ?? "Current admin"}
              </Text>
            </div>
            <div>
              <Text size="sm" className="text-muted-foreground">
                Collection Time
              </Text>
              <Text size="sm" className="mt-1 font-medium">
                {formatBookingTimestampFull(new Date())}
              </Text>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button loading={isSubmitting} onClick={() => void handleSubmit()}>
            Record Collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
