"use client";

import { LandingBookingCta } from "@/components/landing/landing-booking-cta";
import { CricketSeamDivider } from "@/components/landing/cricket-divider";
import { LandingEvents } from "@/components/landing/landing-events";
import { LandingFacilities } from "@/components/landing/landing-facilities";
import { LandingFaq } from "@/components/landing/landing-faq";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingGallery } from "@/components/landing/landing-gallery";
import { GrainOverlay } from "@/components/landing/grain-overlay";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingLocation } from "@/components/landing/landing-location";
import { LandingSocialProof } from "@/components/landing/landing-social-proof";
import { LandingSocialRail } from "@/components/landing/landing-social-rail";
import { LandingPricing } from "@/components/landing/landing-pricing";
import { LandingStats } from "@/components/landing/landing-stats";
import { LandingStory } from "@/components/landing/landing-story";
import { useLandingContent } from "@/features/landing";
import type { LiveLandingStats } from "@/features/landing/services/landing-stats.service";
import type { BusinessSettingsPublic } from "@/features/business-settings/types";

type LandingPageProps = {
  initialBusinessSettings?: BusinessSettingsPublic | null;
  liveStats?: LiveLandingStats | null;
};

export function LandingPage({ initialBusinessSettings, liveStats }: LandingPageProps) {
  const { content } = useLandingContent({ initialBusinessSettings, liveStats });

  return (
    <div className="min-h-screen bg-black">
      <GrainOverlay />
      <LandingSocialRail content={content} />
      <main>
        <LandingHero content={content} />
        <CricketSeamDivider />
        <LandingStory content={content} />
        <LandingFacilities content={content} />
        <CricketSeamDivider />
        <LandingGallery content={content} />
        <LandingSocialProof content={content} />
        <LandingEvents content={content} />
        <LandingPricing content={content} />
        <LandingStats content={content} />
        <LandingBookingCta />
        <LandingLocation content={content} />
        <LandingFaq content={content} />
      </main>
      <LandingFooter content={content} />
    </div>
  );
}
