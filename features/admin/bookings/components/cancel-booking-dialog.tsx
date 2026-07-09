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
import { cn } from "@/lib/utils";

type CancelMode = "cancel_only" | "cancel_and_refund";

type CancelBookingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingReference: string;
  source?: "online" | "manual";
  advancePaid?: number;
  onSubmit: (payload: { reason: string; initiateRefund: boolean }) => Promise<void>;
};

function CancelOptionCard({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-[var(--radius-md)] border p-4 text-left transition-colors",
        active
          ? "border-primary bg-primary/5 ring-primary/30 ring-2"
          : "border-border/70 hover:bg-muted/20",
      )}
    >
      <Text className="font-medium">{title}</Text>
      <Text size="sm" className="text-muted-foreground mt-1">
        {description}
      </Text>
    </button>
  );
}

export function CancelBookingDialog({
  open,
  onOpenChange,
  bookingReference,
  source = "manual",
  advancePaid = 0,
  onSubmit,
}: CancelBookingDialogProps) {
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState<CancelMode>("cancel_only");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canOfferRefund = source === "online" && advancePaid > 0;

  useEffect(() => {
    if (open) {
      setReason("");
      setMode("cancel_only");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a cancellation reason.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        reason: reason.trim(),
        initiateRefund: canOfferRefund && mode === "cancel_and_refund",
      });
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitLabel =
    canOfferRefund && mode === "cancel_and_refund"
      ? `Cancel & Refund ${formatCurrency(advancePaid)}`
      : "Cancel Booking";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Booking</DialogTitle>
          <DialogDescription>
            Cancel {bookingReference}. Slots will be released immediately and the customer will be
            notified.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <FormField label="Reason" htmlFor="cancel-reason">
            <FormTextarea
              id="cancel-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Customer requested cancellation, weather, maintenance…"
              rows={3}
            />
          </FormField>

          {canOfferRefund ? (
            <div className="space-y-2">
              <Text size="sm" className="font-medium">
                Online advance payment
              </Text>
              <div className="grid gap-2">
                <CancelOptionCard
                  active={mode === "cancel_only"}
                  title="Cancel only"
                  description="Release the slot without refunding the online advance."
                  onClick={() => setMode("cancel_only")}
                />
                <CancelOptionCard
                  active={mode === "cancel_and_refund"}
                  title={`Cancel and refund ${formatCurrency(advancePaid)}`}
                  description="Process a Razorpay refund to the customer, then cancel the booking."
                  onClick={() => setMode("cancel_and_refund")}
                />
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Keep Booking
          </Button>
          <Button
            variant="destructive"
            loading={isSubmitting}
            onClick={() => void handleSubmit()}
          >
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
