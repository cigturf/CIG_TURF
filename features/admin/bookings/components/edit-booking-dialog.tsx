"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { AdminBookingDetail } from "@/features/admin/bookings/types/admin-booking.types";
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!booking || !open) return;
    setCustomerName(booking.customerName);
    setCustomerPhone(booking.customerPhone);
    setCustomerEmail(booking.customerEmail);
    setNotes(booking.notes ?? "");
    setTotalPrice(String(booking.totalPrice));
    setAdvancePaid(String(booking.advancePaid));
  }, [booking, open]);

  const remainingAmount = useMemo(() => {
    const total = Number(totalPrice) || 0;
    const advance = Number(advancePaid) || 0;
    return Math.max(total - advance, 0);
  }, [totalPrice, advancePaid]);

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

    setIsSubmitting(true);
    try {
      await onSubmit({
        customerName,
        customerPhone,
        customerEmail,
        notes: notes || undefined,
        totalPrice: total,
        advancePaid: advance,
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
            </FormField>
          </div>

          <div className="border-border/70 bg-muted/20 rounded-[var(--radius-md)] border p-3">
            <Text size="sm" className="text-muted-foreground">
              Remaining (auto)
            </Text>
            <Text className="mt-1 font-semibold">{formatCurrency(remainingAmount)}</Text>
          </div>

          <FormField label="Notes">
            <FormTextarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
          </FormField>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button loading={isSubmitting} onClick={() => void handleSubmit()}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
