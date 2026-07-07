"use client";

import { useEffect, useState } from "react";
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
} from "@/components/design-system";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!booking) return;
    setCustomerName(booking.customerName);
    setCustomerPhone(booking.customerPhone);
    setCustomerEmail(booking.customerEmail);
    setNotes(booking.notes ?? "");
    setTotalPrice(String(booking.totalPrice));
  }, [booking]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        customerName,
        customerPhone,
        customerEmail,
        notes: notes || undefined,
        totalPrice: Number(totalPrice),
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
          <DialogDescription>Update customer details, notes, and total price.</DialogDescription>
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
          <FormField label="Total Price">
            <FormInput
              type="number"
              value={totalPrice}
              onChange={(event) => setTotalPrice(event.target.value)}
            />
          </FormField>
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
