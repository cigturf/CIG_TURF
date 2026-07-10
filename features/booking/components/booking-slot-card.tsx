"use client";

import { Badge } from "@/components/design-system";
import type { BookingSlot, SlotStatus } from "@/features/booking/types";
import { formatCurrency } from "@/utils";
import { cn } from "@/lib/utils";

type BookingSlotCardProps = {
  slot: BookingSlot;
  onSelect: (slotId: string) => void;
};

const STATUS_LABELS: Record<SlotStatus, string> = {
  available: "Available",
  booked: "Booked",
  maintenance: "Maintenance",
  holiday: "Holiday",
  reserved: "Reserved",
  blocked: "Blocked",
  past: "Past",
};

function getStatusLabel(slot: BookingSlot): string {
  if (slot.isSelected) return "Selected";
  if ((slot.status === "maintenance" || slot.status === "blocked") && slot.statusReason) {
    return slot.statusReason;
  }
  return STATUS_LABELS[slot.status];
}

function getStatusVariant(
  slot: BookingSlot,
): "default" | "secondary" | "outline" | "destructive" {
  if (slot.isSelected) return "default";
  if (slot.status === "available") return "secondary";
  if (slot.status === "reserved") return "outline";
  if (slot.status === "past") return "outline";
  return "destructive";
}

function statusTone(slot: BookingSlot): string {
  if (slot.isSelected) return "border-primary bg-primary/10";
  switch (slot.status) {
    case "available":
      return "border-border/70 bg-card hover:border-primary/40 hover:bg-muted/30";
    case "booked":
      return "border-destructive/40 bg-destructive/5";
    case "blocked":
      return "border-orange-500/30 bg-orange-500/5";
    case "maintenance":
      return "border-amber-500/30 bg-amber-500/5";
    case "holiday":
      return "border-purple-500/30 bg-purple-500/5";
    case "reserved":
      return "border-border/70 bg-muted/10";
    case "past":
    default:
      return "border-border/50 bg-muted/10";
  }
}

export function BookingSlotCard({ slot, onSelect }: BookingSlotCardProps) {
  return (
    <button
      type="button"
      disabled={!slot.isSelectable}
      onClick={() => onSelect(slot.id)}
      className={cn(
        "touch-target flex min-h-11 w-full flex-col items-start rounded-[var(--radius-md)] border px-3.5 py-3 text-left transition-all duration-200",
        "focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:outline-none",
        !slot.isSelectable && "cursor-not-allowed opacity-55",
        slot.isSelectable && statusTone(slot),
        slot.isSelected && "ring-primary/30 shadow-[var(--shadow-xs)] ring-1",
      )}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <span
          className={cn(
            "text-sm font-semibold",
            !slot.isSelectable && "text-muted-foreground line-through",
          )}
        >
          {slot.timeLabel}
        </span>
        <Badge variant={getStatusVariant(slot)} className="shrink-0 text-[0.65rem]">
          {getStatusLabel(slot)}
        </Badge>
      </div>
      <span className="text-muted-foreground mt-1 text-xs">{formatCurrency(slot.price)}</span>
      {(slot.status === "maintenance" || slot.status === "blocked") && slot.statusReason ? (
        <span className="text-muted-foreground mt-0.5 line-clamp-2 text-[0.65rem] leading-snug">
          {slot.statusReason}
        </span>
      ) : null}
    </button>
  );
}
