"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

import { Parallax } from "@/components/motion/parallax";
import { Display, FadeUp, LAYOUT, Overline, Reveal, Text } from "@/components/design-system";
import { LANDING_PLACEHOLDERS, LANDING_STORY_ARTWORK } from "@/features/landing";
import type { LandingContent } from "@/features/landing";

type LandingStoryProps = {
  content: LandingContent;
};

/** A single pitch line drawing itself in as the section scrolls into view. */
function PitchLineAccent({ progress }: { progress: import("framer-motion").MotionValue<number> }) {
  const pathLength = useTransform(progress, [0.15, 0.55], [0, 1]);
  const opacity = useTransform(progress, [0.05, 0.2], [0, 1]);

  return (
    <svg
      viewBox="0 0 400 40"
      className="pointer-events-none mx-auto mb-6 h-6 w-40 lg:mx-0"
      aria-hidden="true"
    >
      <motion.path
        d="M4 34 L4 8 L396 8 L396 34"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-primary/70"
        style={{ pathLength, opacity }}
      />
    </svg>
  );
}

export function LandingStory({ content }: LandingStoryProps) {
  const usesPlaceholderDescription = content.description === LANDING_PLACEHOLDERS.heroDescription;
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const rawImageScale = useTransform(scrollYProgress, [0, 1], [1.08, 1.22]);
  const imageScale = reduced ? 1 : rawImageScale;

  return (
    <section
      ref={sectionRef}
      id="experience"
      className="relative scroll-mt-14 overflow-hidden bg-black py-10 sm:scroll-mt-16 sm:py-14 md:py-16"
    >
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div className={LAYOUT.containerXl}>
        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
          <Reveal className="order-2 lg:order-1 lg:col-span-5">
            <Parallax speed="subtle">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-2xl)] sm:aspect-[5/4] lg:aspect-[4/5]">
                <motion.div style={{ scale: imageScale }} className="absolute inset-0">
                  <Image
                    src={LANDING_STORY_ARTWORK.src}
                    alt={LANDING_STORY_ARTWORK.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 42vw"
                    className="object-cover"
                  />
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-transparent to-transparent" />
                <div className="absolute inset-0 ring-1 ring-white/10 ring-inset" />
              </div>
            </Parallax>
          </Reveal>

          <div className="order-1 text-center lg:order-2 lg:col-span-7 lg:text-left">
            <PitchLineAccent progress={scrollYProgress} />
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
