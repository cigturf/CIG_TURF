"use client";

import { useEffect, useState } from "react";
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

type CompleteBookingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remainingAmount: number;
  bookingReference: string;
  onSubmit: (payload: { overrideOutstanding?: boolean; overrideReason?: string }) => Promise<void>;
};

export function CompleteBookingDialog({
  open,
  onOpenChange,
  remainingAmount,
  bookingReference,
  onSubmit,
}: CompleteBookingDialogProps) {
  const [overrideEnabled, setOverrideEnabled] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasOutstanding = remainingAmount > 0;

  useEffect(() => {
    if (open) {
      setOverrideEnabled(false);
      setOverrideReason("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (hasOutstanding && !overrideEnabled) {
      toast.error("Collect outstanding payment or enable owner override.");
      return;
    }
    if (hasOutstanding && overrideEnabled && !overrideReason.trim()) {
      toast.error("Override reason is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Booking</DialogTitle>
          <DialogDescription>
            Mark {bookingReference} as completed and close the operational session.
          </DialogDescription>
        </DialogHeader>

        {hasOutstanding ? (
          <div className="space-y-4">
            <div className="border-destructive/30 bg-destructive/5 rounded-[var(--radius-md)] border p-4">
              <Text className="font-medium">Outstanding payment exists</Text>
              <Text size="sm" className="text-muted-foreground mt-1">
                {formatCurrency(remainingAmount)} is still due. Collect payment before completing, or
                use owner override below.
              </Text>
            </div>

            <label className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border p-4">
              <div>
                <Text className="font-medium">Complete anyway (owner override)</Text>
                <Text size="sm" className="text-muted-foreground mt-1">
                  Logs override reason in the audit trail.
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
