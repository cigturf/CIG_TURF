"use client";

import {
  Card,
  Display,
  Heading,
  LAYOUT,
  Overline,
  Reveal,
  Skeleton,
  SPACING,
  Stagger,
  StaggerItem,
  Text,
} from "@/components/design-system";
import type { LandingContent } from "@/features/landing";
import { cn } from "@/lib/utils";

type LandingPricingProps = {
  content: LandingContent;
};

export function LandingPricing({ content }: LandingPricingProps) {
  const hasTiers = content.pricingTiers.length > 0;

  return (
    <section id="pricing" className={cn("bg-black", SPACING.section.md)}>
      <div className={LAYOUT.containerXl}>
        <Reveal className="mb-6 text-center sm:mb-8 lg:text-left">
          <Overline className="text-primary mb-3 block">Pricing</Overline>
          <Display size="sm" className="mb-2 leading-[0.92] text-white">
            Transparent rates
          </Display>
          <Text className="mx-auto max-w-lg text-white/55 lg:mx-0">
            {hasTiers
              ? "Choose a slot that fits your session."
              : "Pricing tiers will appear once configured in settings."}
          </Text>
        </Reveal>

        {hasTiers ? (
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {content.pricingTiers.map((tier, index) => (
              <StaggerItem key={tier.id}>
                <Card
                  variant="stadium"
                  padding="lg"
                  radius="xl"
                  className={cn(
                    "h-full border-white/10 bg-white/[0.04] text-white",
                    index === 0 && "ring-primary/30 ring-1",
                  )}
                >
                  <p className="text-primary mb-2 text-[0.65rem] tracking-[0.2em] uppercase">
                    per hour
                  </p>
                  <Heading level="h3" className="font-display mb-2 uppercase text-white">
                    {tier.name}
                  </Heading>
                  {tier.priceLabel ? (
                    <p className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                      {tier.priceLabel}
                    </p>
                  ) : null}
                  {tier.description ? (
                    <Text size="sm" className="mt-4 leading-relaxed text-white/55">
                      {tier.description}
                    </Text>
                  ) : null}
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card
                key={i}
                variant="ghost"
                padding="lg"
                radius="xl"
                className="border-white/10 bg-white/[0.03]"
              >
                <Skeleton className="mb-3 h-4 w-16" />
                <Skeleton className="mb-2 h-7 w-28" />
                <Skeleton className="h-10 w-20" />
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
