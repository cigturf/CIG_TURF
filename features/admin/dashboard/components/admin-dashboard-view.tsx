import dynamic from "next/dynamic";
import { Suspense } from "react";

import { DashboardQuickActionsSection } from "@/features/admin/dashboard/components/dashboard-quick-actions-section";
import { DashboardRecentBookingsSection } from "@/features/admin/dashboard/components/dashboard-recent-bookings-section";
import { DashboardStatsSection } from "@/features/admin/dashboard/components/dashboard-stats-section";
import { DashboardTimelineSection } from "@/features/admin/dashboard/components/dashboard-timeline-section";
import { DashboardTodayOperationsSection } from "@/features/admin/dashboard/components/dashboard-today-operations-section";
import { DashboardUpcomingEventsSection } from "@/features/admin/dashboard/components/dashboard-upcoming-events-section";
import type { AdminDashboardData } from "@/features/admin/dashboard/types/dashboard.types";
import { Heading, SkeletonStatsGrid, SkeletonTable, Text } from "@/components/design-system";

const LazyDashboardActivityFeed = dynamic(
  () =>
    import("@/features/admin/dashboard/components/dashboard-activity-feed-section").then(
      (module) => module.DashboardActivityFeedSection,
    ),
  { loading: () => <ActivityFeedSkeleton /> },
);

type AdminDashboardViewProps = {
  data: AdminDashboardData;
};

function ActivityFeedSkeleton() {
  return (
    <div className="border-border/70 bg-card rounded-[var(--radius-xl)] border p-4">
      <div className="mb-4 h-4 w-32 animate-pulse rounded bg-muted" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-12 animate-pulse rounded bg-muted/70" />
        ))}
      </div>
    </div>
  );
}

export function AdminDashboardView({ data }: AdminDashboardViewProps) {
  const todayLabel = new Date(`${data.dateIso}T12:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <div>
        <Heading level="h3" className="mb-1">
          Operations Center
        </Heading>
        <Text className="text-muted-foreground">{todayLabel}</Text>
      </div>

      <DashboardStatsSection stats={data.stats} />

      <DashboardTodayOperationsSection operations={data.operations} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <DashboardTimelineSection items={data.timeline} />
          <DashboardRecentBookingsSection bookings={data.recentBookings} />
          <div className="grid gap-6 lg:grid-cols-2">
            <DashboardQuickActionsSection />
            <DashboardUpcomingEventsSection events={data.upcomingEvents} />
          </div>
        </div>

        <aside className="hidden xl:block">
          <Suspense fallback={<ActivityFeedSkeleton />}>
            <LazyDashboardActivityFeed activities={data.activities} />
          </Suspense>
        </aside>
      </div>

      <div className="xl:hidden">
        <Suspense fallback={<ActivityFeedSkeleton />}>
          <LazyDashboardActivityFeed activities={data.activities} />
        </Suspense>
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted/80" />
      </div>
      <SkeletonStatsGrid className="grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="border-border/70 bg-card rounded-[var(--radius-xl)] border p-4">
            <SkeletonTable rows={6} />
          </div>
          <div className="border-border/70 bg-card rounded-[var(--radius-xl)] border p-4">
            <SkeletonTable rows={5} />
          </div>
        </div>
        <ActivityFeedSkeleton />
      </div>
    </div>
  );
}
