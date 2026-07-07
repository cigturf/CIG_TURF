"use client";

import {
  Ban,
  CalendarCheck,
  CircleDollarSign,
  Clock3,
  IndianRupee,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";

import { AnimatedStatValue } from "@/features/admin/dashboard/components/animated-stat-value";
import type { DashboardStats } from "@/features/admin/dashboard/types/dashboard.types";
import { Card, CardBody, CardHeader, CardTitle, Text } from "@/components/design-system";
import { staggerContainerVariants, staggerItemVariants } from "@/lib/design-system/motion";

const STAT_DEFINITIONS: {
  key: keyof DashboardStats;
  label: string;
  hint: string;
  icon: LucideIcon;
  format: "number" | "currency";
}[] = [
  {
    key: "todaysBookings",
    label: "Today's Bookings",
    hint: "Active bookings scheduled today",
    icon: CalendarCheck,
    format: "number",
  },
  {
    key: "todaysRevenue",
    label: "Today's Revenue",
    hint: "Advance collected today",
    icon: IndianRupee,
    format: "currency",
  },
  {
    key: "pendingCollections",
    label: "Pending Collections",
    hint: "Remaining due at venue",
    icon: CircleDollarSign,
    format: "currency",
  },
  {
    key: "availableSlots",
    label: "Available Slots",
    hint: "Open inventory today",
    icon: LayoutGrid,
    format: "number",
  },
  {
    key: "occupiedSlots",
    label: "Occupied Slots",
    hint: "Booked inventory today",
    icon: Clock3,
    format: "number",
  },
  {
    key: "cancelledBookings",
    label: "Cancelled Bookings",
    hint: "Cancelled today",
    icon: Ban,
    format: "number",
  },
];

type DashboardStatsGridProps = {
  stats: DashboardStats;
};

export function DashboardStatsGrid({ stats }: DashboardStatsGridProps) {
  return (
    <motion.div
      className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-6"
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {STAT_DEFINITIONS.map((definition) => {
        const Icon = definition.icon;
        const value = stats[definition.key];

        return (
          <motion.div key={definition.key} variants={staggerItemVariants}>
            <Card
              variant="admin"
              padding="md"
              className="hover:border-border h-full transition-colors duration-200"
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
