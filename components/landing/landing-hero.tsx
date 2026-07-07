"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";

import { BrandLogo } from "@/components/landing/brand-logo";
import { HeroBackgroundCarousel } from "@/components/landing/hero-background-carousel";
import { Button, LAYOUT, Overline, Text } from "@/components/design-system";
import { LANDING_HERO_ARTWORK, LANDING_PLACEHOLDERS } from "@/features/landing";
import type { LandingContent } from "@/features/landing";
import { DURATION, EASING } from "@/lib/design-system/motion";
import { cn } from "@/lib/utils";

const TRUST_BADGES = ["Premium Turf", "Flood Lights", "Match Ready"] as const;
const TEXT_REVEAL_PROGRESS = 0.28;

type LandingHeroProps = {
  content: LandingContent;
};

export function LandingHero({ content }: LandingHeroProps) {
  const headline = LANDING_PLACEHOLDERS.heroHeadline;
  const reduced = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const [revealText, setRevealText] = useState(reduced === true);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    if (reduced) return;
    setRevealText(progress >= TEXT_REVEAL_PROGRESS);
  });

  return (
    <section
      ref={heroRef}
      id="top"
      className={cn("relative bg-black", reduced ? "h-[100dvh] min-h-[100vh]" : "h-[200dvh]")}
    >
      <div className="sticky top-0 flex h-[100dvh] min-h-[100vh] flex-col overflow-hidden">
        <HeroBackgroundCarousel slides={LANDING_HERO_ARTWORK} />

        <div className="pointer-events-none absolute inset-0 bg-black/50" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,transparent_0%,black/50_100%)]" />

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
                  {/* Text always in flow — fixes button/badge position; opacity toggles on scroll */}
                  <motion.div
                    animate={{ opacity: revealText ? 1 : 0 }}
                    transition={{ duration: DURATION.moderate, ease: EASING.smooth }}
                    className={cn(!revealText && "pointer-events-none select-none")}
                    aria-hidden={!revealText}
                  >
                    <Overline className="text-primary mb-4 block tracking-[0.28em] sm:mb-5">
                      {content.tagline}
                    </Overline>

                    <h1 className="font-display text-[2.25rem] leading-[0.9] font-semibold tracking-tight text-white uppercase sm:text-5xl md:text-6xl lg:text-7xl">
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

                  <AnimatePresence initial={false}>
                    {!revealText ? (
                      <motion.div
                        key="hero-logo"
                        className="absolute inset-0 flex items-start justify-center lg:justify-start"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.99 }}
                        transition={{ duration: DURATION.moderate, ease: EASING.premium }}
                      >
                        <BrandLogo
                          size="hero"
                          priority
                          onDarkSurface
                          alt={content.displayName}
                          imageClassName="h-full max-h-full w-auto max-w-full scale-[1.27] object-contain object-top drop-shadow-[0_10px_40px_rgba(0,0,0,0.6)] mx-auto lg:mx-0 lg:-translate-y-[5%] lg:translate-x-[28%] lg:scale-[1.38] lg:object-left-top"
                        />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
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
