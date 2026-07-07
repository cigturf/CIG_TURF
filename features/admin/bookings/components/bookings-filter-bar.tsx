"use client";

import type {
  AdminBookingListQuery,
  BookingDateFilter,
  BookingSortField,
} from "@/features/admin/bookings/types/admin-booking.types";
import { Button, FilterBar, FilterBarGroup, Input, Text } from "@/components/design-system";
import { cn } from "@/lib/utils";

type BookingsFilterBarProps = {
  query: AdminBookingListQuery;
  onChange: (query: AdminBookingListQuery) => void;
  onManualBooking: () => void;
  onExport: (format: "csv" | "xlsx" | "pdf") => void;
};

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      className={cn("h-8 rounded-full px-3", !active && "bg-background")}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function toggleArrayValue<T extends string>(values: T[] | undefined, value: T) {
  const current = values ?? [];
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
}

export function BookingsFilterBar({
  query,
  onChange,
  onManualBooking,
  onExport,
}: BookingsFilterBarProps) {
  const setDateFilter = (dateFilter: BookingDateFilter) => {
    onChange({
      ...query,
      dateFilter,
      customDate: undefined,
    });
  };

  return (
    <div className="space-y-3">
      <FilterBar>
        <FilterBarGroup className="flex-1">
          <Input
            value={query.search ?? ""}
            onChange={(event) => onChange({ ...query, search: event.target.value || undefined })}
            placeholder="Search booking ID, name, phone, email…"
            className="h-10 min-w-[220px] flex-1"
          />
          <select
            value={query.sort ?? "newest"}
            onChange={(event) =>
              onChange({ ...query, sort: event.target.value as BookingSortField })
            }
            className="border-input bg-background h-10 rounded-[var(--radius-md)] border px-3 text-sm"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="time">Time</option>
            <option value="amount">Amount</option>
            <option value="customer">Customer Name</option>
          </select>
        </FilterBarGroup>
        <FilterBarGroup>
          <Button size="sm" onClick={onManualBooking}>
            Manual Booking
          </Button>
          <Button size="sm" variant="outline" onClick={() => onExport("csv")}>
            CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => onExport("xlsx")}>
            Excel
          </Button>
          <Button size="sm" variant="outline" onClick={() => onExport("pdf")}>
            PDF
          </Button>
        </FilterBarGroup>
      </FilterBar>

      <FilterBar>
        <FilterBarGroup>
          <Text size="sm" className="text-muted-foreground mr-1">
            Date
          </Text>
          <FilterChip active={query.dateFilter === "today"} onClick={() => setDateFilter("today")}>
            Today
          </FilterChip>
          <FilterChip
            active={query.dateFilter === "tomorrow"}
            onClick={() => setDateFilter("tomorrow")}
          >
            Tomorrow
          </FilterChip>
          <FilterChip active={query.dateFilter === "week"} onClick={() => setDateFilter("week")}>
            This Week
          </FilterChip>
          <Input
            type="date"
            value={
              query.dateFilter === "custom" && query.customDate
                ? query.customDate
                : ""
            }
            onChange={(event) =>
              onChange({
                ...query,
                dateFilter: event.target.value ? "custom" : "today",
                customDate: event.target.value || undefined,
              })
            }
            className="h-8 w-[150px]"
          />
        </FilterBarGroup>
      </FilterBar>

      <FilterBar>
        <FilterBarGroup>
          <Text size="sm" className="text-muted-foreground mr-1">
            Status
          </Text>
          {(["confirmed", "arrived", "in_progress", "cancelled", "completed", "pending_payment"] as const).map(
            (status) => (
            <FilterChip
              key={status}
              active={query.status?.includes(status) ?? false}
              onClick={() =>
                onChange({
                  ...query,
                  status: toggleArrayValue(query.status, status),
                })
              }
            >
              {status === "pending_payment"
                ? "Pending Payment"
                : status === "in_progress"
                  ? "In Progress"
                  : status[0]!.toUpperCase() + status.slice(1)}
            </FilterChip>
          ),
          )}
        </FilterBarGroup>
        <FilterBarGroup>
          <Text size="sm" className="text-muted-foreground mr-1">
            Source
          </Text>
          <FilterChip
            active={query.source?.includes("manual") ?? false}
            onClick={() =>
              onChange({ ...query, source: toggleArrayValue(query.source, "manual") })
            }
          >
            Manual
          </FilterChip>
          <FilterChip
            active={query.source?.includes("online") ?? false}
            onClick={() =>
              onChange({ ...query, source: toggleArrayValue(query.source, "online") })
            }
          >
            Online
          </FilterChip>
        </FilterBarGroup>
      </FilterBar>
    </div>
  );
}
