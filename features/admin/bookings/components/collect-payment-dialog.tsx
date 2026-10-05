"use client";

import { Plus, Trash2 } from "lucide-react";
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
import { cn } from "@/lib/utils";

type PaymentPartDraft = {
  key: string;
  amount: string;
  method: OfflinePaymentMethod;
  referenceNumber: string;
};

function createPart(amount: string): PaymentPartDraft {
  return {
    key: Math.random().toString(36).slice(2),
    amount,
    method: "cash",
    referenceNumber: "",
  };
}

type CollectPaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remainingAmount: number;
  collectedByLabel?: string;
  onSubmit: (payload: {
    parts: { amount: number; method: OfflinePaymentMethod; referenceNumber?: string }[];
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
  const [parts, setParts] = useState<PaymentPartDraft[]>([createPart(String(remainingAmount))]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setParts([createPart(String(remainingAmount))]);
      setNotes("");
    }
  }, [open, remainingAmount]);

  const parsedParts = useMemo(
    () => parts.map((part) => ({ ...part, parsedAmount: Number(part.amount) })),
    [parts],
  );
  const totalEntered = parsedParts.reduce(
    (sum, part) => sum + (Number.isFinite(part.parsedAmount) ? part.parsedAmount : 0),
    0,
  );
  const outstandingAfter = Math.max(remainingAmount - totalEntered, 0);
  const isOverAmount = totalEntered > remainingAmount;

  const updatePart = (key: string, patch: Partial<PaymentPartDraft>) => {
    setParts((current) => current.map((part) => (part.key === key ? { ...part, ...patch } : part)));
  };

  const addPart = () => {
    const remaining = Math.max(remainingAmount - totalEntered, 0);
    setParts((current) => [...current, createPart(remaining > 0 ? String(remaining) : "")]);
  };

  const removePart = (key: string) => {
    setParts((current) => (current.length > 1 ? current.filter((part) => part.key !== key) : current));
  };

  const handleSubmit = async () => {
    const validParts = parsedParts.filter((part) => part.parsedAmount > 0);
    if (validParts.length === 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    if (totalEntered > remainingAmount) {
      toast.error("Total across all parts cannot exceed the outstanding balance.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        parts: validParts.map((part) => ({
          amount: part.parsedAmount,
          method: part.method,
          referenceNumber: part.referenceNumber.trim() || undefined,
        })),
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
            Record what the customer actually paid. Split across methods if they paid in parts
            (e.g. some cash, some UPI) — only the total entered is added to finance totals.
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

          <div className="space-y-3">
            {parts.map((part, index) => (
              <div
                key={part.key}
                className="border-border/70 relative grid grid-cols-2 gap-3 rounded-[var(--radius-md)] border p-3"
              >
                <FormField label={index === 0 ? "Amount" : `Part ${index + 1} Amount`}>
                  <FormInput
                    type="number"
                    min={1}
                    value={part.amount}
                    onChange={(event) => updatePart(part.key, { amount: event.target.value })}
                  />
                </FormField>
                <FormField label="Method">
                  <FormSelect
                    value={part.method}
                    onChange={(event) =>
                      updatePart(part.key, { method: event.target.value as OfflinePaymentMethod })
                    }
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="other">Other</option>
                  </FormSelect>
                </FormField>
                <div className="col-span-2">
                  <FormField label="Reference Number (optional)">
                    <FormInput
                      value={part.referenceNumber}
                      onChange={(event) => updatePart(part.key, { referenceNumber: event.target.value })}
                      placeholder="UPI ref, receipt no., etc."
                    />
                  </FormField>
                </div>
                {parts.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removePart(part.key)}
                    className="text-muted-foreground hover:text-destructive absolute top-2 right-2"
                    aria-label="Remove part"
                  >
                    <Trash2 className="size-4" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" size="sm" onClick={addPart}>
            <Plus className="mr-2 size-4" />
            Add Another Part
          </Button>

          <div
            className={cn(
              "flex items-center justify-between rounded-[var(--radius-md)] border px-3 py-2 text-sm",
              isOverAmount ? "border-destructive/40 text-destructive" : "border-border/70",
            )}
          >
            <span>Total entered</span>
            <span className="font-semibold">{formatCurrency(totalEntered)}</span>
          </div>

          <FormField label="Notes (optional)">
            <FormTextarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} />
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
