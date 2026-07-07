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
  Text,
} from "@/components/design-system";
import { addDaysToIsoDate } from "@/features/booking/utils/time";

type SlotHolidayDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeDate: string;
  isHoliday: boolean;
};

type ScopeType = "single" | "range";

export function SlotHolidayDialog({
  open,
  onOpenChange,
  activeDate,
  isHoliday,
}: SlotHolidayDialogProps) {
  const [scope, setScope] = useState<ScopeType>("single");
  const [rangeStart, setRangeStart] = useState(activeDate);
  const [rangeEnd, setRangeEnd] = useState(activeDate);
  const [label, setLabel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setScope("single");
      setRangeStart(activeDate);
      setRangeEnd(activeDate);
      setLabel("");
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

  const submit = async () => {
    setIsSubmitting(true);
    try {
      if (isHoliday) {
        const response = await fetch("/api/admin/slots/holidays", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingDate: activeDate }),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to clear holiday");
        }
        toast.success("Holiday cleared");
        onOpenChange(false);
        return;
      }

      const response = await fetch("/api/admin/slots/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingDates, label: label.trim() || undefined }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to set holiday");
      }
      toast.success("Holiday applied");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Holiday update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Holiday</DialogTitle>
          <DialogDescription>
            Mark an entire day as holiday to prevent any booking. Realtime updates customers and
            admins immediately.
          </DialogDescription>
        </DialogHeader>

        {isHoliday ? (
          <div className="border-destructive/30 bg-destructive/5 rounded-[var(--radius-md)] border p-4">
            <Text className="font-medium">This date is currently marked as holiday.</Text>
            <Text size="sm" className="text-muted-foreground mt-1">
              Clearing it will restore normal slot availability (subject to booked/blocked slots).
            </Text>
          </div>
        ) : (
          <div className="space-y-4">
            <FormField label="Scope">
              <select
                value={scope}
                onChange={(event) => setScope(event.target.value as ScopeType)}
                className="border-input bg-background h-10 w-full rounded-[var(--radius-md)] border px-3 text-sm"
              >
                <option value="single">Single day</option>
                <option value="range">Date range</option>
              </select>
            </FormField>

            {scope === "range" ? (
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Start date">
                  <FormInput
                    type="date"
                    value={rangeStart}
                    onChange={(event) => setRangeStart(event.target.value)}
                  />
                </FormField>
                <FormField label="End date">
                  <FormInput
                    type="date"
                    value={rangeEnd}
                    onChange={(event) => setRangeEnd(event.target.value)}
                  />
                </FormField>
              </div>
            ) : null}

            <FormField label="Label (optional)">
              <FormInput
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder="Public holiday, tournament day, etc."
              />
            </FormField>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button loading={isSubmitting} onClick={() => void submit()} variant={isHoliday ? "destructive" : "default"}>
            {isHoliday ? "Clear Holiday" : "Mark Holiday"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

