"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Clock, CreditCard, Zap } from "lucide-react";

import {
  Button,
  FadeUp,
  LAYOUT,
  Overline,
  Reveal,
  SPACING,
  Text,
} from "@/components/design-system";
import { LANDING_CTA_ARTWORK, LANDING_PLACEHOLDERS } from "@/features/landing";
import { cn } from "@/lib/utils";

const VALUE_PROPS = [
  { icon: Zap, label: "Quick Booking" },
  { icon: CreditCard, label: "Secure Payment" },
  { icon: Clock, label: "Instant Confirmation" },
] as const;

export function LandingBookingCta() {
  const cta = LANDING_PLACEHOLDERS.bookingCta;

  return (
    <section id="book" className="relative overflow-hidden bg-black">
      <div className="absolute inset-0">
        <Image
          src={LANDING_CTA_ARTWORK.src}
          alt={LANDING_CTA_ARTWORK.alt}
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/75" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/50" />
      </div>

      <div className={cn(LAYOUT.containerXl, SPACING.section.md, "relative")}>
        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="text-center lg:col-span-7 lg:text-left">
            <Reveal>
              <Overline className="text-primary mb-4 block">Ready to play?</Overline>
              <h2 className="font-display text-3xl leading-[0.92] font-semibold tracking-tight text-white uppercase sm:text-4xl md:text-5xl lg:text-6xl">
                <span className="block">{cta.heading}</span>
                <span className="text-primary block">{cta.headingAccent}</span>
              </h2>
            </Reveal>
            <FadeUp delay={0.1}>
              <Text className="mx-auto mt-4 max-w-lg text-base text-white/65 sm:mt-5 sm:text-lg lg:mx-0">
                {cta.description}
              </Text>
            </FadeUp>
            <FadeUp delay={0.2}>
              <div className="mt-8 flex justify-center sm:mt-10 lg:justify-start">
                <Link href="/book">
                  <Button
                    variant="booking"
                    size="lg"
                    className="touch-target min-h-11 min-w-[12rem] shadow-lg shadow-black/30"
                  >
                    Book Now
                    <ChevronRight className="size-4" />
                  </Button>
                </Link>
              </div>
              <Text size="sm" className="mt-3 text-white/40">
                No login required to select a slot.
              </Text>
            </FadeUp>
          </div>

          <FadeUp delay={0.15} className="lg:col-span-5">
            <ul className="flex flex-col gap-4 sm:gap-5">
              {VALUE_PROPS.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-4 rounded-[var(--radius-xl)] border border-white/10 bg-white/[0.04] px-4 py-4 backdrop-blur-sm sm:px-5"
                >
                  <div className="bg-primary/15 text-primary flex size-10 items-center justify-center rounded-full">
                    <Icon className="size-4" strokeWidth={1.5} />
                  </div>
                  <span className="text-sm font-medium text-white/85">{label}</span>
                </li>
              ))}
            </ul>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
