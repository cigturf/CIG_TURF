"use client";

import { DateCard } from "@/components/design-system";
import type { BookingDateOption } from "@/features/booking/types";
import { cn } from "@/lib/utils";

type BookingDateSelectorProps = {
  dates: BookingDateOption[];
  selectedDateIso: string | null;
  onSelectDate: (dateIso: string) => void;
  className?: string;
};

export function BookingDateSelector({
  dates,
  selectedDateIso,
  onSelectDate,
  className,
}: BookingDateSelectorProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <h2 className="text-foreground text-sm font-semibold tracking-wide">Select date</h2>
      <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {dates.map((option) => (
          <DateCard
            key={option.iso}
            day={option.day}
            date={option.date}
            month={option.month}
            selected={selectedDateIso === option.iso}
            onClick={() => onSelectDate(option.iso)}
            className="touch-target min-h-11 min-w-[4.75rem]"
          />
        ))}
      </div>
    </div>
  );
}
