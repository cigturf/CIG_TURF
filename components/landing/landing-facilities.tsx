"use client";

import { Car, Lamp, LayoutGrid, Maximize2, Target, Users } from "lucide-react";

import { FacilityRibbonMarquee } from "@/components/landing/facility-ribbon-marquee";
import {
  Display,
  FadeUp,
  LAYOUT,
  Overline,
  Reveal,
  SPACING,
  Text,
} from "@/components/design-system";
import type { LandingContent } from "@/features/landing";
import { cn } from "@/lib/utils";

const FACILITY_ICONS = [LayoutGrid, Lamp, Maximize2, Target, Users, Car] as const;

const SECTION_HEADING = "text-center lg:text-left";

type LandingFacilitiesProps = {
  content: LandingContent;
};

export function LandingFacilities({ content }: LandingFacilitiesProps) {
  return (
    <section id="facilities" className="bg-black">
      <div className="border-y border-white/10 bg-white/[0.03] backdrop-blur-md">
        <div className={cn(LAYOUT.containerXl, "py-3 sm:py-5")}>
          <div className="sm:hidden -mx-4 px-4">
            <FacilityRibbonMarquee facilities={content.facilities} icons={FACILITY_ICONS} />
          </div>

          <div className="hidden grid-cols-3 gap-4 sm:grid lg:grid-cols-3 xl:grid-cols-6">
            {content.facilities.map((facility, index) => {
              const Icon = FACILITY_ICONS[index % FACILITY_ICONS.length]!;
              return (
                <div
                  key={facility.id}
                  className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] px-3 py-3 text-center"
                >
                  <div className="flex size-11 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Icon className="size-5" strokeWidth={1.5} />
                  </div>
                  <p className="text-[0.7rem] leading-snug font-semibold tracking-wide text-white uppercase">
                    {facility.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={cn(LAYOUT.containerXl, SPACING.section.md)}>
        <FadeUp className={cn("mb-8", SECTION_HEADING)}>
          <Overline className="text-primary mb-3 block">Facilities</Overline>
          <Display size="md" className="leading-[0.92] text-white">
            Everything you need for the perfect game
          </Display>
        </FadeUp>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {content.facilities.map((facility) => (
            <Reveal key={facility.id}>
              <article className="group h-full rounded-[var(--radius-xl)] border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-primary/30 hover:bg-white/[0.05] sm:p-6">
                <h3 className="font-display mb-2 text-center text-lg tracking-tight text-white uppercase sm:text-left">
                  {facility.title}
                </h3>
                <Text size="sm" className="text-center leading-relaxed text-white/55 sm:text-left">
                  {facility.description}
                </Text>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
