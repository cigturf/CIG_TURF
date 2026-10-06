"use client";

import type { KeyboardEvent } from "react";
import { useState } from "react";
import {
  Ban,
  CalendarCheck,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  IndianRupee,
  MonitorSmartphone,
  PenLine,
  Percent,
  ReceiptText,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";

import { AnimatedStatValue } from "@/features/admin/dashboard/components/animated-stat-value";
import type { ReportOverview, ReportPaymentBreakdown } from "@/features/admin/reports/types/reports.types";
import { Card, CardBody, CardHeader, CardTitle, Text } from "@/components/design-system";
import { staggerContainerVariants, staggerItemVariants } from "@/lib/design-system/motion";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils";

export type BookingCardFilter = "all" | "active" | "completed" | "cancelled" | "manual" | "online";

const OVERVIEW_DEFINITIONS: {
  key: keyof ReportOverview;
  label: string;
  hint: string;
  icon: LucideIcon;
  format: "number" | "currency" | "percent";
  filter?: BookingCardFilter;
  action?: "offline-breakdown";
}[] = [
  { key: "totalBookings", label: "Total Bookings", hint: "All bookings in period", icon: CalendarCheck, format: "number", filter: "all" },
  { key: "activeBookings", label: "Active Bookings", hint: "Excludes cancelled", icon: CalendarCheck, format: "number", filter: "active" },
  { key: "completedBookings", label: "Completed", hint: "Successfully finished", icon: TrendingUp, format: "number", filter: "completed" },
  { key: "cancelledBookings", label: "Cancelled", hint: "Cancelled bookings", icon: Ban, format: "number", filter: "cancelled" },
  { key: "cancelledAmount", label: "Cancelled Amount", hint: "Subtracted out of Total Amount", icon: Ban, format: "currency" },
  { key: "manualBookings", label: "Manual", hint: "Walk-in / admin created (active)", icon: PenLine, format: "number", filter: "manual" },
  { key: "onlineBookings", label: "Online", hint: "Customer self-serve (active)", icon: MonitorSmartphone, format: "number", filter: "online" },
  { key: "grossBookingValue", label: "Gross Booking Value", hint: "All bookings before cancellations", icon: ReceiptText, format: "currency" },
  { key: "totalAmount", label: "Total Amount", hint: "Gross value minus cancelled bookings", icon: ReceiptText, format: "currency" },
  { key: "totalRevenue", label: "Total Revenue", hint: "Actual collections", icon: IndianRupee, format: "currency" },
  { key: "advanceCollected", label: "Advance Collected", hint: "Advance payments only", icon: Wallet, format: "currency" },
  { key: "offlineCollections", label: "Offline Collections", hint: "Cash, UPI, card at venue", icon: CircleDollarSign, format: "currency", action: "offline-breakdown" },
  { key: "onlineCollections", label: "Online Collections", hint: "Razorpay payments", icon: MonitorSmartphone, format: "currency" },
  { key: "pendingCollections", label: "Pending Collections", hint: "Outstanding at venue", icon: Clock3, format: "currency" },
  { key: "averageBookingValue", label: "Avg Booking Value", hint: "Revenue per active booking", icon: TrendingUp, format: "currency" },
  { key: "occupancyRate", label: "Occupancy Rate", hint: "Booked vs available slots", icon: Percent, format: "percent" },
];

type ReportsOverviewGridProps = {
  overview: ReportOverview;
  activeFilter?: BookingCardFilter;
  onFilterSelect?: (filter: BookingCardFilter) => void;
  /** Cash/UPI/Card/Bank Transfer/Other split behind the Offline Collections total — shown inline when that card expands. */
  offlineCollectionsBreakdown?: ReportPaymentBreakdown[];
};

function formatPercent(value: number) {
  return `${value}%`;
}

export function ReportsOverviewGrid({
  overview,
  activeFilter = "all",
  onFilterSelect,
  offlineCollectionsBreakdown,
}: ReportsOverviewGridProps) {
  const [offlineExpanded, setOfflineExpanded] = useState(false);

  return (
    <motion.div
      className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4"
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {OVERVIEW_DEFINITIONS.map((definition) => {
        const Icon = definition.icon;
        const value = overview[definition.key];
        const isFilterCard = Boolean(definition.filter && onFilterSelect);
        const isOfflineBreakdownCard = Boolean(
          definition.action === "offline-breakdown" && offlineCollectionsBreakdown,
        );
        const isClickable = isFilterCard || isOfflineBreakdownCard;
        const isActive = isFilterCard && definition.filter === activeFilter;

        const handleActivate = () => {
          if (isFilterCard) onFilterSelect?.(definition.filter!);
          if (isOfflineBreakdownCard) setOfflineExpanded((current) => !current);
        };

        return (
          <motion.div key={definition.key} variants={staggerItemVariants}>
            <Card
              variant="admin"
              padding="md"
              className={cn(
                "h-full",
                isClickable && "hover:border-primary/50 cursor-pointer transition-colors",
                isActive && "border-primary ring-primary/20 ring-1",
              )}
              {...(isClickable
                ? {
                    role: "button" as const,
                    tabIndex: 0,
                    onClick: handleActivate,
                    onKeyDown: (event: KeyboardEvent) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleActivate();
                      }
                    },
                  }
                : {})}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    {definition.label}
                  </CardTitle>
                  <Icon className="text-muted-foreground size-4 shrink-0" strokeWidth={1.5} />
                </div>
              </CardHeader>
              <CardBody>
                {definition.format === "percent" ? (
                  <p className="text-2xl font-semibold tracking-tight sm:text-3xl">{formatPercent(value)}</p>
                ) : (
                  <AnimatedStatValue
                    value={value}
                    format={definition.format === "currency" ? "currency" : "number"}
                  />
                )}
                <Text size="sm" className="text-muted-foreground mt-1.5">
                  {definition.hint}
                </Text>
                {isFilterCard ? (
                  <Text size="sm" className="text-primary mt-1 text-xs font-medium">
                    Click to view these bookings →
                  </Text>
                ) : null}
                {isOfflineBreakdownCard ? (
                  <>
                    <span className="text-primary mt-1 flex items-center gap-1 text-xs font-medium">
                      {offlineExpanded ? "Hide" : "Show"} breakdown by method
                      <ChevronDown
                        className={cn("size-3.5 transition-transform", offlineExpanded && "rotate-180")}
                      />
                    </span>
                    {offlineExpanded ? (
                      <div
                        className="mt-3 space-y-2 border-t pt-3"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {!offlineCollectionsBreakdown || offlineCollectionsBreakdown.length === 0 ? (
                          <Text size="sm" className="text-muted-foreground">
                            No offline collections in this period.
                          </Text>
                        ) : (
                          offlineCollectionsBreakdown.map((item) => (
                            <div key={item.method} className="flex items-center justify-between text-sm">
                              <span className="font-medium">{item.method}</span>
                              <span className="text-muted-foreground">
                                {formatCurrency(item.amount)} · {item.percentage}%
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    ) : null}
                  </>
                ) : null}
              </CardBody>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
