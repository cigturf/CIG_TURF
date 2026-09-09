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
  hint: (rangeLabel: string) => string;
  icon: LucideIcon;
  format: "number" | "currency";
}[] = [
  {
    key: "totalAmount",
    label: "Total Amount",
    hint: (rangeLabel) => `Booking value for ${rangeLabel}`,
    icon: IndianRupee,
    format: "currency",
  },
  {
    key: "collectedAmount",
    label: "Collected",
    hint: (rangeLabel) => `Collected for ${rangeLabel}`,
    icon: TrendingUp,
    format: "currency",
  },
  {
    key: "pendingCollections",
    label: "Pending Collections",
    hint: (rangeLabel) => `Outstanding for ${rangeLabel}`,
    icon: CircleDollarSign,
    format: "currency",
  },
  {
    key: "advanceCollected",
    label: "Advance Collected",
    hint: (rangeLabel) => `Advance payments for ${rangeLabel}`,
    icon: Wallet,
    format: "currency",
  },
  {
    key: "offlineCollections",
    label: "Offline Collections",
    hint: () => "Cash, UPI, card at venue",
    icon: IndianRupee,
    format: "currency",
  },
  {
    key: "onlineCollections",
    label: "Online Collections",
    hint: () => "Razorpay payments",
    icon: MonitorSmartphone,
    format: "currency",
  },
  {
    key: "averageBookingValue",
    label: "Avg Booking Value",
    hint: () => "Collected per active booking",
    icon: TrendingUp,
    format: "currency",
  },
];

type FinanceOverviewGridProps = {
  overview: FinanceOverview;
  rangeLabel: string;
};

export function FinanceOverviewGrid({ overview, rangeLabel }: FinanceOverviewGridProps) {
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
                  {definition.hint(rangeLabel)}
                </Text>
              </CardBody>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
