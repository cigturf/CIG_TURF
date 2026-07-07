"use client";

import { CalendarClock } from "lucide-react";

import type { DashboardTimelineItem } from "@/features/admin/dashboard/types/dashboard.types";
import {
  AnalyticsCard,
  EmptyState,
  StatusBadge,
  Text,
} from "@/components/design-system";
import { formatCurrency } from "@/utils";

type DashboardTimelineSectionProps = {
  items: DashboardTimelineItem[];
};

function resolveBookingBadge(item: DashboardTimelineItem) {
  if (item.bookingStatus === "confirmed" && (item.remainingAmount ?? 0) > 0) {
    return { label: "Pending Balance", status: "pending" as const };
  }

  if (item.bookingStatus === "confirmed") {
    return { label: "Confirmed", status: "confirmed" as const };
  }

  if (item.bookingStatus === "completed") {
    return { label: "Completed", status: "completed" as const };
  }

  return { label: "Confirmed", status: "confirmed" as const };
}

export function DashboardTimelineSection({ items }: DashboardTimelineSectionProps) {
  return (
    <AnalyticsCard title="Today's Timeline" description="Live schedule for today">
      {items.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No slots scheduled"
          description="Today's operating window has no upcoming slots to display."
        />
      ) : (
        <div className="divide-border/60 divide-y">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-3 sm:items-center">
                <Text className="text-muted-foreground w-16 shrink-0 font-mono text-sm">
                  {item.timeLabel}
                </Text>
                <div className="min-w-0">
                  {item.kind === "booking" ? (
                    <>
                      <Text className="font-medium">Booking · {item.customerName}</Text>
                      <Text size="sm" className="text-muted-foreground truncate">
                        {item.bookingReference}
                        {(item.remainingAmount ?? 0) > 0
                          ? ` · ${formatCurrency(item.remainingAmount ?? 0)} due`
                          : null}
                      </Text>
                    </>
                  ) : (
                    <Text className="text-muted-foreground font-medium">Available</Text>
                  )}
                </div>
              </div>
              {item.kind === "booking" ? (
                <StatusBadge {...resolveBookingBadge(item)} />
              ) : (
                <StatusBadge label="Open" status="default" />
              )}
            </div>
          ))}
        </div>
      )}
    </AnalyticsCard>
  );
}
