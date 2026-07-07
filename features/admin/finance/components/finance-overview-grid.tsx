"use client";

import {
  CircleDollarSign,
  IndianRupee,
  MonitorSmartphone,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";

import { AnimatedStatValue } from "@/features/admin/dashboard/components/animated-stat-value";
import type { FinanceOverview } from "@/features/admin/finance/types/finance.types";
import { Card, CardBody, CardHeader, CardTitle, Text } from "@/components/design-system";
import { staggerContainerVariants, staggerItemVariants } from "@/lib/design-system/motion";

const OVERVIEW_DEFINITIONS: {
  key: keyof FinanceOverview;
  label: string;
  hint: string;
  icon: LucideIcon;
  format: "number" | "currency";
}[] = [
  { key: "todaysRevenue", label: "Today's Revenue", hint: "Collected today", icon: IndianRupee, format: "currency" },
  { key: "thisWeekRevenue", label: "This Week", hint: "Last 7 days collected", icon: TrendingUp, format: "currency" },
  { key: "thisMonthRevenue", label: "This Month", hint: "Month-to-date collected", icon: Wallet, format: "currency" },
  { key: "pendingCollections", label: "Pending Collections", hint: "Outstanding across bookings", icon: CircleDollarSign, format: "currency" },
  { key: "advanceCollected", label: "Advance Collected", hint: "Advance payments in period", icon: Wallet, format: "currency" },
  { key: "offlineCollections", label: "Offline Collections", hint: "Cash, UPI, card at venue", icon: IndianRupee, format: "currency" },
  { key: "onlineCollections", label: "Online Collections", hint: "Razorpay payments", icon: MonitorSmartphone, format: "currency" },
  { key: "averageBookingValue", label: "Avg Booking Value", hint: "Collected per active booking", icon: TrendingUp, format: "currency" },
];

type FinanceOverviewGridProps = {
  overview: FinanceOverview;
};

export function FinanceOverviewGrid({ overview }: FinanceOverviewGridProps) {
  return (
    <motion.div
      className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4"
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
                <AnimatedStatValue value={value} format={definition.format} />
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
