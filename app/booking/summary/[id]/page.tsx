import { CalendarX } from "lucide-react";

import { getAppConfig } from "@/config/app.config";
import { EmptyState, LAYOUT } from "@/components/design-system";
import { PublicBookingSummaryPage } from "@/features/booking/components/public-booking-summary-page";
import { getPublicBookingSummary } from "@/features/booking/lib/public-booking-summary";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Booking Summary",
  robots: { index: false, follow: false },
};

type SummaryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BookingSummaryRoute({ params }: SummaryPageProps) {
  const { id } = await params;
  const booking = await getPublicBookingSummary(id);
  const venueName = getAppConfig().envDisplayName;

  return (
    <div className="surface-public min-h-screen">
      {booking ? (
        <PublicBookingSummaryPage booking={booking} venueName={venueName} />
      ) : (
        <div className={cn(LAYOUT.containerMd, "py-16")}>
          <EmptyState
            icon={CalendarX}
            title="Booking not found"
            description="This link may be incorrect or the booking no longer exists."
          />
        </div>
      )}
    </div>
  );
}
