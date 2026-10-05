import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OfflineCollectionsBreakdownCard } from "@/features/admin/finance/components/offline-collections-breakdown-card";

describe("OfflineCollectionsBreakdownCard", () => {
  it("expands when the toggle is clicked", () => {
    render(
      <OfflineCollectionsBreakdownCard
        total={500}
        breakdown={[{ method: "Cash", amount: 300, count: 2, percentage: 60 }]}
      />,
    );

    expect(screen.queryByText("Cash")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Show by method"));
    expect(screen.getByText("Cash")).toBeInTheDocument();
  });
});
