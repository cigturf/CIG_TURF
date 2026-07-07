"use client";

import Image from "next/image";

import { Display, FadeUp, LAYOUT, Overline, Reveal, Text } from "@/components/design-system";
import { LANDING_PLACEHOLDERS, LANDING_STORY_ARTWORK } from "@/features/landing";
import type { LandingContent } from "@/features/landing";

type LandingStoryProps = {
  content: LandingContent;
};

export function LandingStory({ content }: LandingStoryProps) {
  const usesPlaceholderDescription = content.description === LANDING_PLACEHOLDERS.heroDescription;

  return (
    <section id="experience" className="relative overflow-hidden bg-black py-10 sm:py-14 md:py-16">
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div className={LAYOUT.containerXl}>
        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
          <Reveal className="order-2 lg:order-1 lg:col-span-5">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-2xl)] sm:aspect-[5/4] lg:aspect-[4/5]">
              <Image
                src={LANDING_STORY_ARTWORK.src}
                alt={LANDING_STORY_ARTWORK.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="object-cover transition-transform duration-700 hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-transparent to-transparent" />
              <div className="absolute inset-0 ring-1 ring-white/10 ring-inset" />
            </div>
          </Reveal>

          <div className="order-1 text-center lg:order-2 lg:col-span-7 lg:text-left">
            <FadeUp>
              <Overline className="text-primary mb-4 block">The Experience</Overline>
              <Display size="lg" className="mb-5 leading-[0.92] text-white">
                <span className="block">{LANDING_PLACEHOLDERS.storyHeading.line1}</span>
                <span className="text-primary block">{LANDING_PLACEHOLDERS.storyHeading.line2}</span>
              </Display>
            </FadeUp>
            <FadeUp delay={0.1}>
              <Text size="lg" className="mx-auto max-w-xl text-white/65 lg:mx-0">
                {usesPlaceholderDescription ? LANDING_PLACEHOLDERS.storyBody : content.description}
              </Text>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}
