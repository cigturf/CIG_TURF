"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
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
import { LANDING_FACILITY_ARTWORK } from "@/features/landing";
import type { LandingContent, LandingFacility } from "@/features/landing";
import { cn } from "@/lib/utils";

const FACILITY_ICONS = [LayoutGrid, Lamp, Maximize2, Target, Users, Car] as const;

const SECTION_HEADING = "text-center lg:text-left";

type LandingFacilitiesProps = {
  content: LandingContent;
};

export function LandingFacilities({ content }: LandingFacilitiesProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section id="facilities" className="scroll-mt-14 bg-black sm:scroll-mt-16">
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
        <FadeUp className={cn("mb-8 lg:mb-10", SECTION_HEADING)}>
          <Overline className="text-primary mb-3 block">Facilities</Overline>
          <Display size="md" className="leading-[0.92] text-white">
            Everything you need for the perfect game
          </Display>
        </FadeUp>

        {/* Desktop: a pinned visual that swaps as each facility scrolls through
            focus — the image never re-flows the page, only the highlighted
            card and the picture behind it change as you scroll past. */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <div className="sticky top-28 aspect-[4/5] overflow-hidden rounded-[var(--radius-2xl)] ring-1 ring-white/10">
              {content.facilities.map((facility, index) => {
                const artwork = LANDING_FACILITY_ARTWORK[index % LANDING_FACILITY_ARTWORK.length]!;
                const Icon = FACILITY_ICONS[index % FACILITY_ICONS.length]!;
                return (
                  <motion.div
                    key={facility.id}
                    className="absolute inset-0"
                    initial={false}
                    animate={{ opacity: activeIndex === index ? 1 : 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  >
                    <Image
                      src={artwork.src}
                      alt={artwork.alt}
                      fill
                      sizes="480px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/10" />
                    <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                      <div className="bg-primary/20 text-primary mb-4 flex size-11 items-center justify-center rounded-full backdrop-blur-sm">
                        <Icon className="size-5" strokeWidth={1.5} />
                      </div>
                      <h3 className="font-display mb-2 text-xl tracking-tight text-white uppercase">
                        {facility.title}
                      </h3>
                      <Text size="sm" className="leading-relaxed text-white/70">
                        {facility.description}
                      </Text>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col lg:col-span-7">
            {content.facilities.map((facility, index) => (
              <FacilityFocusItem
                key={facility.id}
                facility={facility}
                index={index}
                active={activeIndex === index}
                icon={FACILITY_ICONS[index % FACILITY_ICONS.length]!}
                onFocus={() => setActiveIndex(index)}
              />
            ))}
          </div>
        </div>

        {/* Mobile/tablet: a simple stacked reveal — sticky scrollytelling
            needs viewport headroom a phone screen doesn't have. */}
        <div className="grid gap-6 sm:grid-cols-2 lg:hidden lg:gap-5">
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

type FacilityFocusItemProps = {
  facility: LandingFacility;
  index: number;
  active: boolean;
  icon: (typeof FACILITY_ICONS)[number];
  onFocus: () => void;
};

function FacilityFocusItem({ facility, index, active, icon: Icon, onFocus }: FacilityFocusItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Fires when the item drifts into the vertical center band of the
  // viewport — that's the "reading position" this list scrolls past.
  const isInFocusBand = useInView(ref, { margin: "-42% 0px -42% 0px" });

  useEffect(() => {
    if (isInFocusBand) onFocus();
    // onFocus intentionally excluded — it closes over setActiveIndex and is
    // stable in practice; including it would re-run this on every parent
    // re-render triggered by the very state change this effect causes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInFocusBand]);

  return (
    <div
      ref={ref}
      className={cn(
        "border-l-2 py-8 pl-6 transition-colors duration-300 first:pt-0 last:pb-0",
        active ? "border-primary" : "border-white/10",
      )}
    >
      <div
        className={cn(
          "mb-3 flex size-9 items-center justify-center rounded-full transition-colors duration-300",
          active ? "bg-primary/20 text-primary" : "bg-white/5 text-white/40",
        )}
      >
        <Icon className="size-4" strokeWidth={1.5} />
      </div>
      <h3
        className={cn(
          "font-display mb-2 text-2xl tracking-tight uppercase transition-colors duration-300",
          active ? "text-white" : "text-white/40",
        )}
      >
        {facility.title}
      </h3>
      <Text
        size="sm"
        className={cn(
          "max-w-md leading-relaxed transition-colors duration-300",
          active ? "text-white/70" : "text-white/30",
        )}
      >
        {facility.description}
      </Text>
      <span className="sr-only">{`Facility ${index + 1} of list`}</span>
    </div>
  );
}
