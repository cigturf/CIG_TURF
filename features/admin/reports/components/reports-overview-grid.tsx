"use client";

import {
  Ban,
  CalendarCheck,
  CircleDollarSign,
  Clock3,
  IndianRupee,
  MonitorSmartphone,
  PenLine,
  Percent,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";

import { AnimatedStatValue } from "@/features/admin/dashboard/components/animated-stat-value";
import type { ReportOverview } from "@/features/admin/reports/types/reports.types";
import { Card, CardBody, CardHeader, CardTitle, Text } from "@/components/design-system";
import { staggerContainerVariants, staggerItemVariants } from "@/lib/design-system/motion";

const OVERVIEW_DEFINITIONS: {
  key: keyof ReportOverview;
  label: string;
  hint: string;
  icon: LucideIcon;
  format: "number" | "currency" | "percent";
}[] = [
  { key: "totalBookings", label: "Total Bookings", hint: "All bookings in period", icon: CalendarCheck, format: "number" },
  { key: "completedBookings", label: "Completed", hint: "Successfully finished", icon: TrendingUp, format: "number" },
  { key: "cancelledBookings", label: "Cancelled", hint: "Cancelled bookings", icon: Ban, format: "number" },
  { key: "manualBookings", label: "Manual", hint: "Walk-in / admin created", icon: PenLine, format: "number" },
  { key: "onlineBookings", label: "Online", hint: "Customer self-serve", icon: MonitorSmartphone, format: "number" },
  { key: "totalRevenue", label: "Total Revenue", hint: "Actual collections", icon: IndianRupee, format: "currency" },
  { key: "advanceCollected", label: "Advance Collected", hint: "Payments received", icon: Wallet, format: "currency" },
  { key: "offlineCollections", label: "Offline Collections", hint: "Cash, UPI, card at venue", icon: CircleDollarSign, format: "currency" },
  { key: "pendingCollections", label: "Pending Collections", hint: "Outstanding at venue", icon: Clock3, format: "currency" },
  { key: "averageBookingValue", label: "Avg Booking Value", hint: "Revenue per active booking", icon: TrendingUp, format: "currency" },
  { key: "occupancyRate", label: "Occupancy Rate", hint: "Booked vs available slots", icon: Percent, format: "percent" },
];

type ReportsOverviewGridProps = {
  overview: ReportOverview;
};

function formatPercent(value: number) {
  return `${value}%`;
}

export function ReportsOverviewGrid({ overview }: ReportsOverviewGridProps) {
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

        return (
          <motion.div key={definition.key} variants={staggerItemVariants}>
            <Card variant="admin" padding="md" className="h-full">
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
              </CardBody>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
