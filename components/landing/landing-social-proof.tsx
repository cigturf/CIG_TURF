"use client";

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
import { resolveLandingIcon } from "@/features/landing/lib/landing-icons";
import type { LandingContent } from "@/features/landing";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const SECTION_HEADING = "text-center lg:text-left";

type LandingSocialProofProps = {
  content: LandingContent;
};

export function LandingSocialProof({ content }: LandingSocialProofProps) {
  if (content.socialProof.length === 0) return null;

  return (
    <section className={cn("bg-black", SPACING.section.sm)}>
      <div className={LAYOUT.containerXl}>
        <Reveal className={cn("mb-6 sm:mb-8", SECTION_HEADING)}>
          <Overline className="text-primary mb-3 block">Community</Overline>
          <Display size="sm" className="leading-[0.92] text-white">
            Why players keep coming back
          </Display>
        </Reveal>

        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {content.socialProof.map((item) => {
            const Icon = resolveLandingIcon(item.icon, Star);
            return (
              <StaggerItem key={item.id}>
                <article className="group h-full rounded-[var(--radius-xl)] border border-white/10 bg-white/[0.03] p-5 transition-colors duration-300 hover:border-primary/25 hover:bg-white/[0.05] sm:p-6">
                  <div className="bg-primary/15 text-primary mb-4 flex size-11 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-105">
                    <Icon className="size-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display mb-2 text-center text-base tracking-tight text-white uppercase sm:text-left">
                    {item.title}
                  </h3>
                  <Text size="sm" className="text-center text-white/55 sm:text-left">
                    {item.description}
                  </Text>
                </article>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
