"use client";

import { useEffect, useMemo, useState } from "react";
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
  FormInput,
  FormSelect,
  FormTextarea,
  Text,
} from "@/components/design-system";
import { addDaysToIsoDate } from "@/features/booking/utils/time";

type SlotBulkBlockDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeDate: string;
  selectedSlotIds: string[];
  onDone: () => void;
};

type ActionType = "block" | "maintenance" | "unblock";

type ScopeType = "single" | "range";

export function SlotBulkBlockDialog({
  open,
  onOpenChange,
  activeDate,
  selectedSlotIds,
  onDone,
}: SlotBulkBlockDialogProps) {
  const [action, setAction] = useState<ActionType>("block");
  const [scope, setScope] = useState<ScopeType>("single");
  const [rangeStart, setRangeStart] = useState(activeDate);
  const [rangeEnd, setRangeEnd] = useState(activeDate);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setAction("block");
      setScope("single");
      setRangeStart(activeDate);
      setRangeEnd(activeDate);
      setReason("");
    }
  }, [open, activeDate]);

  const bookingDates = useMemo(() => {
    if (scope === "single") return [activeDate];
    const dates: string[] = [];
    let cursor = rangeStart;
    while (cursor <= rangeEnd) {
      dates.push(cursor);
      cursor = addDaysToIsoDate(cursor, 1);
      if (dates.length > 370) break;
    }
    return dates;
  }, [scope, activeDate, rangeStart, rangeEnd]);

  const handleSubmit = async () => {
    if (selectedSlotIds.length === 0) {
      toast.error("Select at least one slot.");
      return;
    }
    if (scope === "range" && rangeStart > rangeEnd) {
      toast.error("Invalid date range.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (action === "unblock") {
        const response = await fetch("/api/admin/slots/blocks", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingDates, slotIds: selectedSlotIds }),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to unblock slots");
        }
        toast.success("Slots unblocked");
      } else {
        const response = await fetch("/api/admin/slots/blocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingDates,
            slotIds: selectedSlotIds,
            state: action === "maintenance" ? "maintenance" : "blocked",
            reason: reason.trim() || undefined,
          }),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to update slots");
        }
        toast.success(action === "maintenance" ? "Maintenance applied" : "Slots blocked");
      }

      onOpenChange(false);
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update slots");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Actions</DialogTitle>
          <DialogDescription>
            Block, set maintenance, or unblock selected slots. Date range support is included for
            tournament and maintenance planning.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-border/70 bg-muted/20 rounded-[var(--radius-md)] border p-4">
            <Text className="font-medium">{selectedSlotIds.length} slot(s) selected</Text>
            <Text size="sm" className="text-muted-foreground mt-1">
              Applies across {bookingDates.length} date(s).
            </Text>
          </div>

          <FormField label="Action">
            <FormSelect value={action} onChange={(event) => setAction(event.target.value as ActionType)}>
              <option value="block">Block</option>
              <option value="maintenance">Maintenance</option>
              <option value="unblock">Unblock</option>
            </FormSelect>
          </FormField>

          <FormField label="Date Scope">
            <FormSelect value={scope} onChange={(event) => setScope(event.target.value as ScopeType)}>
              <option value="single">Single day</option>
              <option value="range">Date range</option>
            </FormSelect>
          </FormField>

          {scope === "range" ? (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Start date">
                <FormInput type="date" value={rangeStart} onChange={(event) => setRangeStart(event.target.value)} />
              </FormField>
              <FormField label="End date">
                <FormInput type="date" value={rangeEnd} onChange={(event) => setRangeEnd(event.target.value)} />
              </FormField>
            </div>
          ) : null}

          {action !== "unblock" ? (
            <FormField label="Reason (optional)">
              <FormTextarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                placeholder="Maintenance, private booking, tournament, cleaning…"
              />
            </FormField>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button loading={isSubmitting} onClick={() => void handleSubmit()}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

