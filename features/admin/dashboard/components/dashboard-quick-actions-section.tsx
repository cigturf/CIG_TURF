import Link from "next/link";
import {
  BarChart3,
  CalendarPlus,
  Clock,
  IndianRupee,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { ADMIN_ROUTES } from "@/features/admin/config/admin-navigation";
import { AnalyticsCard, Text } from "@/components/design-system";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS: {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
}[] = [
  {
    label: "Manual Booking",
    description: "Create a walk-in or phone booking",
    href: ADMIN_ROUTES.bookings,
    icon: CalendarPlus,
  },
  {
    label: "Block Slots",
    description: "Hold inventory for maintenance",
    href: ADMIN_ROUTES.slots,
    icon: Clock,
  },
  {
    label: "Update Pricing",
    description: "Adjust rates and peak windows",
    href: ADMIN_ROUTES.pricing,
    icon: IndianRupee,
  },
  {
    label: "Create Event",
    description: "Publish tournaments and camps",
    href: ADMIN_ROUTES.events,
    icon: Sparkles,
  },
  {
    label: "View Reports",
    description: "Open revenue and ops reports",
    href: ADMIN_ROUTES.reports,
    icon: BarChart3,
  },
];

export function DashboardQuickActionsSection() {
  return (
    <AnalyticsCard title="Quick Actions" description="Common operational shortcuts">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.label}
              href={action.href}
              className={cn(
                "border-border/80 bg-card hover:border-primary/35 hover:bg-muted/20",
                "flex items-start gap-3 rounded-[var(--radius-lg)] border p-4 transition-colors",
              )}
            >
              <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)]">
                <Icon className="size-4" strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1">
                <Text className="block font-semibold leading-snug">{action.label}</Text>
                <Text size="sm" className="text-muted-foreground mt-1 block leading-snug">
                  {action.description}
                </Text>
              </span>
            </Link>
          );
        })}
      </div>
    </AnalyticsCard>
  );
}
