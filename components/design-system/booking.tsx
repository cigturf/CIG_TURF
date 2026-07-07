"use client";

import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { STATUS_COLORS } from "@/lib/design-system/colors";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
  {
    variants: {
      status: {
        pending: STATUS_COLORS.pending,
        confirmed: STATUS_COLORS.confirmed,
        cancelled: STATUS_COLORS.cancelled,
        completed: STATUS_COLORS.completed,
        default: STATUS_COLORS.default,
      },
    },
    defaultVariants: { status: "default" },
  },
);

type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof statusBadgeVariants> & { label: string };

export function StatusBadge({ label, status = "default", className, ...props }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ status }), className)} {...props}>
      {label}
    </span>
  );
}

type DateCardProps = HTMLAttributes<HTMLButtonElement> & {
  day: string;
  date: string;
  month?: string;
  selected?: boolean;
  disabled?: boolean;
};

export function DateCard({
  day,
  date,
  month,
  selected,
  disabled,
  className,
  ...props
}: DateCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "flex min-w-[4.5rem] shrink-0 flex-col items-center rounded-[var(--radius-lg)] border px-3 py-3 transition-all duration-200",
        "focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-40",
        selected
          ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-sm)]"
          : "border-border/70 bg-card hover:border-border hover:bg-muted/40",
        className,
      )}
      {...props}
    >
      <span className="text-[0.65rem] font-medium tracking-wide uppercase opacity-80">{day}</span>
      <span className="font-display mt-0.5 text-xl leading-none font-semibold">{date}</span>
      {month ? <span className="mt-1 text-[0.65rem] opacity-70">{month}</span> : null}
    </button>
  );
}

type TimeSlotCardProps = HTMLAttributes<HTMLButtonElement> & {
  time: string;
  price?: string;
  selected?: boolean;
  disabled?: boolean;
  unavailable?: boolean;
};

export function TimeSlotCard({
  time,
  price,
  selected,
  disabled,
  unavailable,
  className,
  ...props
}: TimeSlotCardProps) {
  return (
    <button
      type="button"
      disabled={disabled || unavailable}
      className={cn(
        "flex w-full flex-col items-start rounded-[var(--radius-md)] border px-3.5 py-3 text-left transition-all duration-200",
        "focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:outline-none",
        "disabled:cursor-not-allowed",
        unavailable && "border-border/40 bg-muted/30 line-through opacity-50",
        !unavailable &&
          !disabled &&
          (selected
            ? "border-primary bg-primary/8 ring-primary/30 shadow-[var(--shadow-xs)] ring-1"
            : "border-border/70 bg-card hover:border-primary/40 hover:bg-muted/30"),
        className,
      )}
      {...props}
    >
      <span className="text-sm font-semibold">{time}</span>
      {price ? <span className="text-muted-foreground mt-0.5 text-xs">{price}</span> : null}
    </button>
  );
}

type SummaryRow = { label: string; value: string };

type BookingSummaryProps = {
  rows: SummaryRow[];
  className?: string;
};

export function BookingSummary({ rows, className }: BookingSummaryProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {rows.map((row) => (
        <div key={row.label} className="flex items-start justify-between gap-4 text-sm">
          <span className="text-muted-foreground">{row.label}</span>
          <span className="text-right font-medium">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

type PriceLine = { label: string; amount: string; emphasis?: boolean };

type PriceSummaryProps = {
  lines: PriceLine[];
  total: { label: string; amount: string };
  className?: string;
};

export function PriceSummary({ lines, total, className }: PriceSummaryProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {lines.map((line) => (
        <div key={line.label} className="flex items-center justify-between text-sm">
          <span className={line.emphasis ? "font-medium" : "text-muted-foreground"}>
            {line.label}
          </span>
          <span className={line.emphasis ? "font-semibold" : ""}>{line.amount}</span>
        </div>
      ))}
      <div className="border-border/60 border-t pt-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">{total.label}</span>
          <span className="text-base font-semibold">{total.amount}</span>
        </div>
      </div>
    </div>
  );
}
