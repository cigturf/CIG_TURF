"use client";

import {
  Activity,
  ImageIcon,
  IndianRupee,
  LogIn,
  ShieldCheck,
  TimerOff,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { DashboardActivity } from "@/features/admin/dashboard/types/dashboard.types";
import { RelativeTime } from "@/components/common/relative-time";
import { AnalyticsCard, EmptyState, Text } from "@/components/design-system";

const ACTIVITY_ICONS: Record<DashboardActivity["type"], LucideIcon> = {
  booking_confirmed: ShieldCheck,
  slot_cancelled: TimerOff,
  price_updated: IndianRupee,
  gallery_updated: ImageIcon,
  admin_login: LogIn,
};

type DashboardActivityFeedSectionProps = {
  activities: DashboardActivity[];
  className?: string;
};

export function DashboardActivityFeedSection({
  activities,
  className,
}: DashboardActivityFeedSectionProps) {
  return (
    <AnalyticsCard
      title="Activity Feed"
      description="Recent operational events"
      className={className}
    >
      {activities.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No recent activity"
          description="Operational events will stream here as your team works."
        />
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => {
            const Icon = ACTIVITY_ICONS[activity.type];

            return (
              <div key={activity.id} className="flex gap-3">
                <span className="bg-muted/60 text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)]">
                  <Icon className="size-4" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Text size="sm" className="font-medium">
                      {activity.title}
                    </Text>
                    <Text size="sm" className="text-muted-foreground shrink-0">
                      <RelativeTime timestamp={activity.timestamp} />
                    </Text>
                  </div>
                  <Text size="sm" className="text-muted-foreground mt-0.5">
                    {activity.description}
                  </Text>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AnalyticsCard>
  );
}
