"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { isGenuineRazorpayPayment } from "@/features/admin/bookings/lib/booking-utils";
import type {
  AdminBookingDetail,
  OfflinePaymentMethod,
} from "@/features/admin/bookings/types/admin-booking.types";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormCheckbox,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  Text,
} from "@/components/design-system";
import { formatCurrency } from "@/utils";

type EditBookingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: AdminBookingDetail | null;
  onSubmit: (payload: {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    notes?: string;
    totalPrice: number;
    advancePaid: number;
    advanceAdjustmentMethod?: OfflinePaymentMethod;
  }) => Promise<void>;
};

export function EditBookingDialog({
  open,
  onOpenChange,
  booking,
  onSubmit,
}: EditBookingDialogProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [advancePaid, setAdvancePaid] = useState("");
  const [adjustmentMethod, setAdjustmentMethod] = useState<OfflinePaymentMethod>("cash");
  const [confirmedRazorpayWarning, setConfirmedRazorpayWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // The one amount Razorpay actually, verifiably captured for this booking's
  // advance (method "online" with no collectedBy — never admin-recorded).
  // Anything above this the admin enters gets tracked as its own separate
  // payment, never folded into Razorpay's own immutable record.
  const genuineRazorpayAmount = useMemo(() => {
    if (!booking) return 0;
    return booking.payments
      .filter((payment) => payment.type === "advance" && isGenuineRazorpayPayment(payment))
      .reduce((sum, payment) => sum + payment.amount, 0);
  }, [booking]);

  useEffect(() => {
    if (!booking || !open) return;
    setCustomerName(booking.customerName);
    setCustomerPhone(booking.customerPhone);
    setCustomerEmail(booking.customerEmail);
    setNotes(booking.notes ?? "");
    setTotalPrice(String(booking.totalPrice));
    setAdvancePaid(String(booking.advancePaid));
    setAdjustmentMethod("cash");
    setConfirmedRazorpayWarning(false);
  }, [booking, open]);

  const remainingAmount = useMemo(() => {
    const total = Number(totalPrice) || 0;
    const advance = Number(advancePaid) || 0;
    return Math.max(total - advance, 0);
  }, [totalPrice, advancePaid]);

  const advanceNumber = Number(advancePaid) || 0;
  const advanceChanged = booking ? advanceNumber !== booking.advancePaid : false;
  const isBelowRazorpayAmount = advanceChanged && advanceNumber < genuineRazorpayAmount;
  const extraBeyondRazorpay = advanceChanged ? Math.max(advanceNumber - genuineRazorpayAmount, 0) : 0;
  const needsRazorpayWarning = genuineRazorpayAmount > 0 && advanceChanged && extraBeyondRazorpay > 0;

  useEffect(() => {
    setConfirmedRazorpayWarning(false);
  }, [advancePaid]);

  const handleSubmit = async () => {
    const total = Number(totalPrice);
    const advance = Number(advancePaid) || 0;

    if (!Number.isFinite(total) || total < 0) {
      toast.error("Enter a valid total price.");
      return;
    }
    if (!Number.isFinite(advance) || advance < 0) {
      toast.error("Enter a valid advance amount.");
      return;
    }
    if (advance > total) {
      toast.error("Advance cannot exceed the total price.");
      return;
    }
    if (isBelowRazorpayAmount) {
      toast.error(
        `Razorpay genuinely collected ${formatCurrency(genuineRazorpayAmount)} for this booking — the advance can't be reduced below that without a real refund.`,
      );
      return;
    }
    if (needsRazorpayWarning && !confirmedRazorpayWarning) {
      toast.error("Please confirm the Razorpay warning below before saving.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        customerName,
        customerPhone,
        customerEmail,
        notes: notes || undefined,
        totalPrice: total,
        advancePaid: advance,
        advanceAdjustmentMethod: needsRazorpayWarning ? adjustmentMethod : undefined,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
          <DialogDescription>
            Update customer details, total, and advance for manual or online bookings. Remaining
            updates automatically as total − advance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <FormField label="Customer Name">
            <FormInput value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
          </FormField>
          <FormField label="Phone">
            <FormInput value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} />
          </FormField>
          <FormField label="Email">
            <FormInput value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Total Price">
              <FormInput
                type="number"
                min={0}
                value={totalPrice}
                onChange={(event) => setTotalPrice(event.target.value)}
              />
            </FormField>
            <FormField label="Advance Paid">
              <FormInput
                type="number"
                min={0}
                value={advancePaid}
                onChange={(event) => setAdvancePaid(event.target.value)}
              />
              {genuineRazorpayAmount > 0 ? (
                <Text size="sm" className="text-muted-foreground mt-1 text-xs">
                  Razorpay genuinely collected {formatCurrency(genuineRazorpayAmount)} for this booking.
                </Text>
              ) : null}
            </FormField>
          </div>

          <div className="border-border/70 bg-muted/20 rounded-[var(--radius-md)] border p-3">
            <Text size="sm" className="text-muted-foreground">
              Remaining (auto)
            </Text>
            <Text className="mt-1 font-semibold">{formatCurrency(remainingAmount)}</Text>
          </div>

          {isBelowRazorpayAmount ? (
            <div className="border-destructive/30 bg-destructive/5 rounded-[var(--radius-md)] border p-3">
              <Text size="sm" className="text-destructive font-medium">
                Razorpay collected {formatCurrency(genuineRazorpayAmount)} — the advance can&apos;t go
                below that without processing a real refund first.
              </Text>
            </div>
          ) : null}

          {needsRazorpayWarning ? (
            <div className="border-warning/30 bg-warning/10 space-y-3 rounded-[var(--radius-md)] border p-3">
              <Text size="sm" className="font-medium">
                Razorpay only collected {formatCurrency(genuineRazorpayAmount)} for this booking. Are
                you sure you want to change the advance to {formatCurrency(advanceNumber)}?
              </Text>
              <Text size="sm" className="text-muted-foreground text-xs">
                The original {formatCurrency(genuineRazorpayAmount)} Razorpay payment won&apos;t be
                touched — the additional {formatCurrency(extraBeyondRazorpay)} will be recorded as a
                separate payment, by whichever method you pick below.
              </Text>
              <FormField label="Method for the additional amount">
                <FormSelect
                  value={adjustmentMethod}
                  onChange={(event) => setAdjustmentMethod(event.target.value as OfflinePaymentMethod)}
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="other">Other</option>
                </FormSelect>
              </FormField>
              <FormCheckbox
                label={`I understand Razorpay only collected ${formatCurrency(genuineRazorpayAmount)}, and the extra ${formatCurrency(extraBeyondRazorpay)} will be logged separately as ${adjustmentMethod}.`}
                checked={confirmedRazorpayWarning}
                onChange={(event) => setConfirmedRazorpayWarning(event.target.checked)}
              />
            </div>
          ) : null}

          <FormField label="Notes">
            <FormTextarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
          </FormField>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            loading={isSubmitting}
            disabled={isBelowRazorpayAmount || (needsRazorpayWarning && !confirmedRazorpayWarning)}
            onClick={() => void handleSubmit()}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
