"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  FormTextarea,
  Text,
} from "@/components/design-system";
import { formatCurrency } from "@/utils";

type CancelBookingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingReference: string;
  /** Online advance eligible for Razorpay refund; 0 hides refund option. */
  refundableAmount?: number;
  onSubmit: (payload: { reason: string; issueRefund: boolean }) => Promise<void>;
};

export function CancelBookingDialog({
  open,
  onOpenChange,
  bookingReference,
  refundableAmount = 0,
  onSubmit,
}: CancelBookingDialogProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canRefund = refundableAmount > 0;

  const handleSubmit = async (issueRefund: boolean) => {
    if (!reason.trim()) {
      toast.error("Please provide a cancellation reason.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ reason: reason.trim(), issueRefund });
      onOpenChange(false);
      setReason("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Booking</DialogTitle>
          <DialogDescription>
            Cancel {bookingReference}? Slots will become available immediately.
            {canRefund
              ? ` Choose whether to refund the online advance of ${formatCurrency(refundableAmount)}.`
              : " No online advance refund applies to this booking."}
          </DialogDescription>
        </DialogHeader>

        <FormField label="Reason">
          <FormTextarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Customer requested cancellation, weather, maintenance…"
            rows={4}
          />
        </FormField>

        {canRefund ? (
          <Text size="sm" className="text-muted-foreground">
            Cancel only keeps the advance payment on record. Cancel &amp; refund initiates a Razorpay
            refund to the customer.
          </Text>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Keep Booking
          </Button>
          {canRefund ? (
            <>
              <Button
                variant="destructive"
                loading={isSubmitting}
                onClick={() => void handleSubmit(false)}
              >
                Cancel only
              </Button>
              <Button
                variant="destructive"
                loading={isSubmitting}
                onClick={() => void handleSubmit(true)}
              >
                Cancel &amp; refund
              </Button>
            </>
          ) : (
            <Button
              variant="destructive"
              loading={isSubmitting}
              onClick={() => void handleSubmit(false)}
            >
              Cancel booking
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
