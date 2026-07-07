import { DashboardStatsGrid } from "@/features/admin/dashboard/components/dashboard-stats-grid";
import type { DashboardStats } from "@/features/admin/dashboard/types/dashboard.types";

type DashboardStatsSectionProps = {
  stats: DashboardStats;
};

export function DashboardStatsSection({ stats }: DashboardStatsSectionProps) {
  return <DashboardStatsGrid stats={stats} />;
}
