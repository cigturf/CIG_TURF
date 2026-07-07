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
} from "@/components/design-system";

type CancelBookingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingReference: string;
  onSubmit: (reason: string) => Promise<void>;
};

export function CancelBookingDialog({
  open,
  onOpenChange,
  bookingReference,
  onSubmit,
}: CancelBookingDialogProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a cancellation reason.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(reason.trim());
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
            Cancel {bookingReference}? Slots will become available immediately and customer
            notification architecture will be prepared.
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep Booking
          </Button>
          <Button variant="destructive" loading={isSubmitting} onClick={() => void handleSubmit()}>
            Cancel Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
