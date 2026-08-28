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
import { addDaysToIsoDate, formatMinutesAsTime } from "@/features/booking/utils/time";
import { parseSlotId } from "@/features/booking/utils/slot-id";
import { cn } from "@/lib/utils";

type SlotBlockConflict = { bookingDate: string; slotId: string };

function formatConflictLabel(conflict: SlotBlockConflict): string {
  const parsed = parseSlotId(conflict.slotId);
  const dateLabel = new Date(`${conflict.bookingDate}T00:00:00`).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
  if (!parsed) return dateLabel;
  return `${dateLabel} ${formatMinutesAsTime(parsed.startMinute)}`;
}

type SlotBulkBlockDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeDate: string;
  selectedSlotIds: string[];
  defaultAction?: ActionType;
  onDone: () => void;
};

type ActionType = "block" | "maintenance" | "unblock";

type ScopeType = "single" | "range";

const MAINTENANCE_REASON_PRESETS = [
  "Raining",
  "Field under maintenance",
  "Private event",
  "Cleaning",
  "Tournament",
] as const;

export function SlotBulkBlockDialog({
  open,
  onOpenChange,
  activeDate,
  selectedSlotIds,
  defaultAction = "block",
  onDone,
}: SlotBulkBlockDialogProps) {
  const [action, setAction] = useState<ActionType>(defaultAction);
  const [scope, setScope] = useState<ScopeType>("single");
  const [rangeStart, setRangeStart] = useState(activeDate);
  const [rangeEnd, setRangeEnd] = useState(activeDate);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setAction(defaultAction);
      setScope("single");
      setRangeStart(activeDate);
      setRangeEnd(activeDate);
      setReason("");
    }
  }, [open, activeDate, defaultAction]);

  const bookingDates = useMemo(() => {
    if (scope === "single") return [activeDate];
    const dates: string[] = [];
    let cursor = rangeStart;
    while (cursor <= rangeEnd) {
      dates.push(cursor);
      cursor = addDaysToIsoDate(cursor, 1);
      if (dates.length > 366) break;
    }
    return dates;
  }, [scope, activeDate, rangeStart, rangeEnd]);

  // Slot ids are date-scoped (`${dateIso}-${startMinute}`); strip the date the
  // selection was made on so the same time-of-day can be re-applied to every
  // date in the chosen range, including dates outside the 7-day booking window.
  const slotTimeSuffixes = useMemo(
    () => selectedSlotIds.map((id) => id.slice(activeDate.length + 1)),
    [selectedSlotIds, activeDate],
  );

  const blockItems = useMemo(
    () =>
      bookingDates.map((bookingDate) => ({
        bookingDate,
        slotIds: slotTimeSuffixes.map((suffix) => `${bookingDate}-${suffix}`),
      })),
    [bookingDates, slotTimeSuffixes],
  );

  const handleSubmit = async () => {
    if (selectedSlotIds.length === 0) {
      toast.error("Select at least one slot.");
      return;
    }
    if (scope === "range" && rangeStart > rangeEnd) {
      toast.error("Invalid date range.");
      return;
    }
    if (action !== "unblock" && !reason.trim()) {
      toast.error("Choose or enter a reason.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (action === "unblock") {
        const response = await fetch("/api/admin/slots/blocks", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: blockItems }),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to unblock slots");
        }
        toast.success("Slots available for booking again");
      } else {
        const response = await fetch("/api/admin/slots/blocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: blockItems,
            state: action === "maintenance" ? "maintenance" : "blocked",
            reason: reason.trim(),
          }),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to update slots");
        }

        const body = (await response.json()) as {
          blockedCount?: number;
          conflicts?: SlotBlockConflict[];
        };
        const blockedCount = body.blockedCount ?? 0;
        const conflicts = body.conflicts ?? [];

        if (conflicts.length > 0) {
          const labels = conflicts.slice(0, 5).map(formatConflictLabel).join(", ");
          const more = conflicts.length > 5 ? ` and ${conflicts.length - 5} more` : "";
          toast.error(
            `${conflicts.length} slot(s) already booked and could not be blocked: ${labels}${more}`,
          );
        }

        if (blockedCount > 0) {
          toast.success(
            action === "maintenance"
              ? `Maintenance applied to ${blockedCount} slot(s)`
              : `${blockedCount} slot(s) blocked`,
          );
        }

        if (blockedCount === 0) {
          return;
        }
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
          <DialogTitle>Slot availability</DialogTitle>
          <DialogDescription>
            Put selected slots under maintenance or block them. Customers cannot book these slots
            while active. Unblock to make them available again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-border/70 bg-muted/20 rounded-[var(--radius-md)] border p-4">
            <Text className="font-medium">{selectedSlotIds.length} slot(s) selected</Text>
            <Text size="sm" className="text-muted-foreground mt-1">
              Applies across {bookingDates.length} date(s). Changes go live immediately.
            </Text>
          </div>

          <FormField label="Action">
            <FormSelect value={action} onChange={(event) => setAction(event.target.value as ActionType)}>
              <option value="maintenance">Under maintenance</option>
              <option value="block">Block</option>
              <option value="unblock">Remove &amp; make available</option>
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
            <div className="space-y-2">
              <Text size="sm" className="font-medium">
                Reason
              </Text>
              <div className="flex flex-wrap gap-2">
                {MAINTENANCE_REASON_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setReason(preset)}
                    className={cn(
                      "rounded-[var(--radius-md)] border px-3 py-1.5 text-sm transition-colors",
                      reason === preset
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border/70 text-muted-foreground hover:bg-muted/30",
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <FormField label="Custom reason">
                <FormTextarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={2}
                  placeholder="Raining, field under maintenance…"
                />
              </FormField>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button loading={isSubmitting} onClick={() => void handleSubmit()}>
            {action === "unblock" ? "Make available" : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
