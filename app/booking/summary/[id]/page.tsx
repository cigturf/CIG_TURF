import { CalendarX } from "lucide-react";

import { getAppConfig } from "@/config/app.config";
import { EmptyState, LAYOUT } from "@/components/design-system";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingLocation } from "@/components/landing/landing-location";
import { PublicBookingSummaryPage } from "@/features/booking/components/public-booking-summary-page";
import { getPublicBookingSummary } from "@/features/booking/lib/public-booking-summary";
import { resolveLandingContent } from "@/features/landing/lib/landing-content";
import {
  mergePublicBusinessSettings,
  resolveBusinessName,
  resolveShortName,
} from "@/features/business-settings/lib/parse";
import { cn } from "@/lib/utils";
import { SettingsService } from "@/server/settings";

export const metadata = {
  title: "Booking Summary",
  robots: { index: false, follow: false },
};

type SummaryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BookingSummaryRoute({ params }: SummaryPageProps) {
  const { id } = await params;
  const [booking, rawSettings] = await Promise.all([
    getPublicBookingSummary(id),
    SettingsService.getPublic(),
  ]);
  const settings = mergePublicBusinessSettings(rawSettings);

  const envDisplayName = getAppConfig().envDisplayName;
  const landingContent = resolveLandingContent(
    settings,
    resolveBusinessName(settings, envDisplayName),
    resolveShortName(settings, envDisplayName),
  );

  return (
    <div className="surface-public min-h-screen">
      {booking ? (
        <>
          <PublicBookingSummaryPage booking={booking} venueName={landingContent.displayName} />
          <LandingLocation content={landingContent} />
        </>
      ) : (
        <div className={cn(LAYOUT.containerMd, "py-16")}>
          <EmptyState
            icon={CalendarX}
            title="Booking not found"
            description="This link may be incorrect or the booking no longer exists."
          />
        </div>
      )}
      <LandingFooter content={landingContent} />
    </div>
  );
}
