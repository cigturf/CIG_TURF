"use client";

import { AnimatedCounter } from "@/features/landing/components/animated-counter";
import { resolveLandingIcon } from "@/features/landing/lib/landing-icons";
import { Trophy } from "lucide-react";

import {
  Display,
  LAYOUT,
  Overline,
  Reveal,
  SPACING,
  Stagger,
  StaggerItem,
  Text,
} from "@/components/design-system";
import type { LandingContent } from "@/features/landing";
import { cn } from "@/lib/utils";

const SECTION_HEADING = "text-center lg:text-left";

type LandingStatsProps = {
  content: LandingContent;
};

export function LandingStats({ content }: LandingStatsProps) {
  return (
    <section className={cn("bg-black", SPACING.section.md)}>
      <div className={LAYOUT.containerXl}>
        <Reveal className={cn("mb-6 sm:mb-8", SECTION_HEADING)}>
          <Overline className="text-primary mb-3 block">By the numbers</Overline>
          <Display size="sm" className="leading-[0.92] text-white">
            Cricket moments that matter
          </Display>
        </Reveal>

        <div className="turf-gradient border-primary/20 from-primary/20 via-primary/10 to-primary/5 relative overflow-hidden rounded-[var(--radius-2xl)] border bg-gradient-to-r p-5 sm:p-6 md:p-8">
          <div className="stadium-glow pointer-events-none absolute -right-16 -bottom-16 size-48 opacity-40" />
          <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {content.stats.map((stat) => {
              const Icon = resolveLandingIcon(stat.icon, Trophy);
              return (
                <StaggerItem key={stat.id}>
                  <div className="flex items-start gap-3 sm:flex-col sm:items-center sm:text-center">
                    <div className="bg-warning/15 text-warning flex size-11 shrink-0 items-center justify-center rounded-full">
                      <Icon className="size-5" strokeWidth={1.5} />
                    </div>
                    <div>
                      <AnimatedCounter
                        value={stat.value}
                        suffix={stat.suffix}
                        className="text-white"
                      />
                      <Text
                        size="sm"
                        className="mt-2 font-medium tracking-wide text-white/60 uppercase"
                      >
                        {stat.label}
                      </Text>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
