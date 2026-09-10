"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useRef } from "react";

import { BrandLogo } from "@/components/landing/brand-logo";
import { HeroBackgroundCarousel } from "@/components/landing/hero-background-carousel";
import { HeroCricketScrub } from "@/components/landing/hero-cricket-scrub";
import { Button, LAYOUT, Overline, Text } from "@/components/design-system";
import { LANDING_HERO_ARTWORK, LANDING_PLACEHOLDERS } from "@/features/landing";
import type { LandingContent } from "@/features/landing";
import { cn } from "@/lib/utils";

const TRUST_BADGES = ["Premium Turf", "Flood Lights", "Match Ready"] as const;

type LandingHeroProps = {
  content: LandingContent;
};

export function LandingHero({ content }: LandingHeroProps) {
  const headline = LANDING_PLACEHOLDERS.heroHeadline;
  const reduced = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end end"],
  });

  // Every value below is driven directly by scroll position, not a timer or
  // a threshold snap — scrubbing the page scrubs the reveal, frame by frame.
  // Cinematic open: dark → floodlights flicker on → logo → headline → a
  // ball/impact/"FOUR" beat (see HeroCricketScrub) → settle.
  // Dim, not black — the stadium should read as "lights not on yet", not a
  // blackout, so there's something to see even before any scrolling happens.
  const rawDarknessOpacity = useTransform(scrollYProgress, [0, 0.1], [0.55, 0]);
  const rawLightBeamOpacity = useTransform(
    scrollYProgress,
    [0.02, 0.04, 0.06, 0.08, 0.12],
    [0, 0.6, 0.3, 0.75, 1],
  );

  // The logo and headline share the same on-screen slot, so their fades must
  // not overlap — otherwise both are half-visible at once mid-scroll and the
  // crest shows through the headline text.
  const rawLogoOpacity = useTransform(scrollYProgress, [0.13, 0.2], [1, 0]);
  const rawLogoScale = useTransform(scrollYProgress, [0, 0.2], [1, 1.05]);
  // Belt-and-braces on top of the opacity fade: once it's done, stop the
  // logo from painting at all. Without this a residual "ghost" of the crest
  // can remain faintly visible well past where opacity should have hit 0.
  const rawLogoVisibility = useTransform(scrollYProgress, [0.199, 0.2], ["visible", "hidden"]);
  const rawContentOpacity = useTransform(scrollYProgress, [0.2, 0.3], [0, 1]);
  const rawContentY = useTransform(scrollYProgress, [0.2, 0.3], [20, 0]);

  const darknessOpacity = reduced ? 0 : rawDarknessOpacity;
  const lightBeamOpacity = reduced ? 1 : rawLightBeamOpacity;
  const logoOpacity = reduced ? 0 : rawLogoOpacity;
  const logoScale = reduced ? 1 : rawLogoScale;
  const logoVisibility = reduced ? "hidden" : rawLogoVisibility;
  const contentOpacity = reduced ? 1 : rawContentOpacity;
  const contentY = reduced ? 0 : rawContentY;

  return (
    <section
      ref={heroRef}
      id="top"
      className={cn(
        "relative scroll-mt-14 bg-black sm:scroll-mt-16",
        reduced ? "h-[100dvh] min-h-[100vh]" : "h-[280dvh]",
      )}
    >
      <div className="sticky top-0 flex h-[100dvh] min-h-[100vh] flex-col overflow-hidden">
        <HeroBackgroundCarousel slides={LANDING_HERO_ARTWORK} />

        <div className="pointer-events-none absolute inset-0 bg-black/50" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />
        {/* Keeps the headline column readable regardless of which carousel
            photo is showing — a plain linear fade wasn't dark enough by the
            time it reached the text; this holds a flat, strong tone across
            the whole column instead of fading the moment it starts. */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.88)_45%,rgba(0,0,0,0.45)_65%,rgba(0,0,0,0.1)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,transparent_0%,black/50_100%)]" />

        {/* Cold open: floodlights are off, then flicker on as the user starts scrolling.
            Darkness must sit above the foreground content (z-10) too, or the
            logo/headline stay fully lit while only the background photo dims.
            The beams sit ABOVE the darkness layer — they're the thing turning
            on, so they need to read clearly even while the dim veil is still
            present, not be muted underneath it. */}
        <motion.div
          style={{ opacity: darknessOpacity }}
          className="pointer-events-none absolute inset-0 z-20 bg-black"
        />
        <motion.div
          style={{ opacity: lightBeamOpacity }}
          className="pointer-events-none absolute inset-0 z-[21]"
        >
          <div className="absolute -top-1/4 left-[4%] h-[140%] w-24 -rotate-[18deg] bg-gradient-to-b from-white/40 via-white/10 to-transparent blur-2xl sm:left-[8%] sm:w-40" />
          <div className="absolute -top-1/4 right-[8%] h-[140%] w-20 rotate-[14deg] bg-gradient-to-b from-white/35 via-white/10 to-transparent blur-2xl sm:right-[15%] sm:w-32" />
        </motion.div>

        {reduced ? null : <HeroCricketScrub progress={scrollYProgress} />}

        <div
          className={cn(
            LAYOUT.containerXl,
            "relative z-10 flex flex-1 flex-col justify-center pt-20 pb-6 sm:pt-24",
          )}
        >
          <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
              <div className="w-full text-center lg:text-left">
                <div className="relative w-full">
                  {/* Both layers are pinned to the same scroll position — scrubbing
                      the page scrubs the logo out and the headline in, in lockstep. */}
                  <motion.div style={{ opacity: contentOpacity, y: contentY }}>
                    <Overline className="text-primary mb-4 block tracking-[0.28em] sm:mb-5">
                      {content.tagline}
                    </Overline>

                    <h1 className="font-display text-[2.25rem] leading-[1.15] font-semibold tracking-tight text-white uppercase sm:text-5xl sm:leading-[1.05] md:text-6xl md:leading-[0.95] lg:text-7xl lg:leading-[0.9]">
                      <span className="block">{headline.line1}</span>
                      <span className="text-primary block">{headline.line2}</span>
                    </h1>

                    <Text
                      size="lg"
                      className="mx-auto mt-5 max-w-lg text-base text-white/70 sm:mt-6 sm:text-lg lg:mx-0"
                    >
                      {content.description}
                    </Text>
                  </motion.div>

                  <motion.div
                    style={{
                      opacity: logoOpacity,
                      scale: logoScale,
                      visibility: logoVisibility,
                    }}
                    className="pointer-events-none absolute inset-0 flex items-start justify-center lg:justify-start"
                  >
                    <BrandLogo
                      size="hero"
                      priority
                      onDarkSurface
                      alt={content.displayName}
                      imageClassName="h-full max-h-full w-auto max-w-full scale-[1.45] translate-x-[3%] object-contain object-top drop-shadow-[0_10px_40px_rgba(0,0,0,0.6)] mx-auto lg:mx-0 lg:translate-y-[4%] lg:translate-x-[35%] lg:scale-[1.46] lg:object-left-top"
                    />
                  </motion.div>
                </div>

                <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                  <Link href="#book" className="w-full sm:w-auto">
                    <Button
                      variant="booking"
                      size="lg"
                      fullWidth
                      className="touch-target min-h-11 sm:min-w-[11rem]"
                    >
                      Book Now
                      <ChevronRight className="size-4" />
                    </Button>
                  </Link>
                  <Link href="#facilities" className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="lg"
                      fullWidth
                      className="touch-target border-white/25 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10 hover:text-white sm:min-w-[11rem]"
                    >
                      Explore Turf
                    </Button>
                  </Link>
                </div>

                <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 lg:mt-10 lg:justify-start">
                  {TRUST_BADGES.map((badge) => (
                    <li
                      key={badge}
                      className="text-[0.65rem] tracking-[0.2em] text-white/45 uppercase"
                    >
                      {badge}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mobile-hidden relative lg:col-span-5 lg:block">
              <div className="relative ml-auto aspect-[4/5] w-full max-w-sm">
                <Image
                  src="/landing/hero-equipment.jpg"
                  alt="Premium cricket equipment"
                  fill
                  sizes="400px"
                  className="rounded-[var(--radius-2xl)] object-cover shadow-2xl ring-1 ring-white/10"
                  priority
                />
                <div className="absolute inset-0 rounded-[var(--radius-2xl)] bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex justify-center pb-6 sm:pb-8">
          <a
            href="#experience"
            aria-label="Scroll to experience"
            className="touch-target flex flex-col items-center justify-center gap-1 text-white/45 transition-colors hover:text-white/75"
          >
            <span className="text-[0.6rem] tracking-[0.25em] uppercase">Scroll</span>
            <ChevronDown className="size-4 animate-bounce" strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </section>
  );
}
