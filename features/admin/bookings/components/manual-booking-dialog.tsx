"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { BookingSlotGrid } from "@/features/booking/components/booking-slot-grid";
import {
  buildBookingDateOptions,
  generateSlots,
  resolveBookingEngineConfig,
} from "@/features/booking/services";
import { getTodayIso } from "@/features/booking/utils/time";
import { toggleConsecutiveSlot } from "@/features/booking/utils";
import { useRealtimeSlots } from "@/features/realtime/hooks/use-realtime-slots";
import { useRealtimePricing } from "@/features/pricing/hooks/use-realtime-pricing";
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
import { useConfigContext } from "@/components/providers/config-provider";

type ManualBookingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDateIso?: string;
  initialSelectedSlotIds?: string[];
  initialCustomerName?: string;
  initialCustomerPhone?: string;
  initialCustomerEmail?: string;
  onSubmit: (payload: {
    bookingDate: string;
    selectedSlots: string[];
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    totalPrice: number;
    advancePaid: number;
    remainingAmount: number;
    notes?: string;
  }) => Promise<void>;
};

export function ManualBookingDialog({
  open,
  onOpenChange,
  defaultDateIso,
  initialSelectedSlotIds,
  initialCustomerName,
  initialCustomerPhone,
  initialCustomerEmail,
  onSubmit,
}: ManualBookingDialogProps) {
  const { publicSettings } = useConfigContext();
  const config = useMemo(() => resolveBookingEngineConfig(publicSettings), [publicSettings]);
  const dateOptions = useMemo(
    () => buildBookingDateOptions(config.bookingWindowDays),
    [config.bookingWindowDays],
  );

  const resolvedDefaultDate =
    defaultDateIso && dateOptions.some((option) => option.iso === defaultDateIso)
      ? defaultDateIso
      : (dateOptions[0]?.iso ?? getTodayIso());

  const [dateIso, setDateIso] = useState<string | null>(resolvedDefaultDate);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setDateIso(resolvedDefaultDate);
      setSelectedSlotIds(initialSelectedSlotIds?.length ? initialSelectedSlotIds : []);
      setCustomerName(initialCustomerName ?? "");
      setCustomerPhone(initialCustomerPhone ?? "");
      setCustomerEmail(initialCustomerEmail ?? "");
    }
  }, [
    open,
    resolvedDefaultDate,
    initialSelectedSlotIds,
    initialCustomerName,
    initialCustomerPhone,
    initialCustomerEmail,
  ]);
  const { bookedSlotIds, blockedSlotIds, maintenanceSlotIds, isHoliday } = useRealtimeSlots(dateIso);
  const { snapshot: pricingSnapshot } = useRealtimePricing();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [advancePaid, setAdvancePaid] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const slots = useMemo(() => {
    if (!dateIso) return [];
    return generateSlots({
      dateIso,
      config,
      now: new Date(),
      selectedSlotIds,
      bookedSlotIds: new Set(bookedSlotIds),
      blockedSlotIds: new Set(blockedSlotIds),
      maintenanceSlotIds: new Set(maintenanceSlotIds),
      isHoliday,
      pricing: pricingSnapshot,
    });
  }, [
    dateIso,
    selectedSlotIds,
    config,
    bookedSlotIds,
    blockedSlotIds,
    maintenanceSlotIds,
    isHoliday,
    pricingSnapshot,
  ]);

  const remainingAmount = useMemo(() => {
    const total = Number(totalPrice) || 0;
    const advance = Number(advancePaid) || 0;
    return Math.max(total - advance, 0);
  }, [totalPrice, advancePaid]);

  const toggleSlot = useCallback(
    (slotId: string) => {
      setSelectedSlotIds((current) => {
        const result = toggleConsecutiveSlot(slots, current, slotId, config);
        return result.selectedSlotIds;
      });
    },
    [slots, config],
  );

  const resetForm = () => {
    setSelectedSlotIds([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setTotalPrice("");
    setAdvancePaid("");
    setNotes("");
  };

  const handleSubmit = async () => {
    if (!dateIso || selectedSlotIds.length === 0) {
      toast.error("Select a date and at least one slot.");
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error("Customer name and phone are required.");
      return;
    }

    const total = Number(totalPrice);
    const advance = Number(advancePaid) || 0;
    if (!total || total <= 0) {
      toast.error("Enter a valid total price.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        bookingDate: dateIso,
        selectedSlots: selectedSlotIds,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        totalPrice: total,
        advancePaid: advance,
        remainingAmount: Math.max(total - advance, 0),
        notes: notes.trim() || undefined,
      });
      onOpenChange(false);
      resetForm();
      toast.success("Manual booking created.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manual Booking</DialogTitle>
          <DialogDescription>
            Create a walk-in or phone booking. If you enter the customer&apos;s email, a booking
            confirmation is sent automatically (when customer emails are enabled in Settings).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <FormField label="Date">
            <select
              value={dateIso ?? ""}
              onChange={(event) => {
                setDateIso(event.target.value);
                setSelectedSlotIds([]);
              }}
              className="border-input bg-background h-10 w-full rounded-[var(--radius-md)] border px-3 text-sm"
            >
              {dateOptions.map((option) => (
                <option key={option.iso} value={option.iso}>
                  {option.day}, {option.date} {option.month}
                </option>
              ))}
            </select>
          </FormField>

          <BookingSlotGrid slots={slots} onToggleSlot={toggleSlot} />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Customer Name">
              <FormInput value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
            </FormField>
            <FormField label="Phone">
              <FormInput value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} />
            </FormField>
            <FormField label="Email (optional)">
              <FormInput value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} />
            </FormField>
            <FormField label="Total Price">
              <FormInput
                type="number"
                value={totalPrice}
                onChange={(event) => setTotalPrice(event.target.value)}
              />
            </FormField>
            <FormField label="Advance Paid">
              <FormInput
                type="number"
                value={advancePaid}
                onChange={(event) => setAdvancePaid(event.target.value)}
              />
            </FormField>
            <FormField label="Remaining">
              <FormInput value={String(remainingAmount)} readOnly />
            </FormField>
          </div>

          <FormField label="Notes">
            <FormTextarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
          </FormField>

          {customerEmail ? (
            <Text size="sm" className="text-muted-foreground">
              A booking confirmation email will be sent to this address after the booking is created.
            </Text>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button loading={isSubmitting} onClick={() => void handleSubmit()}>
            Create Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
