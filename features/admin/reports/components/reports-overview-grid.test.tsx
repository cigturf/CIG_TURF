import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReportsOverviewGrid } from "@/features/admin/reports/components/reports-overview-grid";
import type { ReportOverview } from "@/features/admin/reports/types/reports.types";

function createOverview(overrides: Partial<ReportOverview> = {}): ReportOverview {
  return {
    totalBookings: 10,
    activeBookings: 8,
    completedBookings: 5,
    cancelledBookings: 2,
    manualBookings: 3,
    onlineBookings: 5,
    grossBookingValue: 10000,
    cancelledAmount: 1000,
    totalAmount: 9000,
    totalRevenue: 7000,
    advanceCollected: 2000,
    offlineCollections: 5000,
    onlineCollections: 2000,
    pendingCollections: 2000,
    averageBookingValue: 900,
    occupancyRate: 60,
    ...overrides,
  };
}

describe("ReportsOverviewGrid", () => {
  it("expands the Offline Collections card in place to show its breakdown by method", () => {
    render(
      <ReportsOverviewGrid
        overview={createOverview()}
        offlineCollectionsBreakdown={[
          { method: "Cash", amount: 3000, count: 4, percentage: 60 },
          { method: "UPI", amount: 2000, count: 2, percentage: 40 },
        ]}
      />,
    );

    expect(screen.queryByText("Cash")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Show breakdown by method"));
    expect(screen.getByText("Cash")).toBeInTheDocument();
    expect(screen.getByText("UPI")).toBeInTheDocument();
  });

  it("doesn't make the Offline Collections card clickable when no breakdown is passed", () => {
    render(<ReportsOverviewGrid overview={createOverview()} />);
    expect(screen.queryByText("Show breakdown by method")).not.toBeInTheDocument();
  });
});
