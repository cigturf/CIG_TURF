"use client";

import Image from "next/image";
import Link from "next/link";
import { Calendar, ChevronRight } from "lucide-react";

import {
  Button,
  Display,
  FadeUp,
  LAYOUT,
  Overline,
  Reveal,
  SPACING,
  Text,
} from "@/components/design-system";
import type { LandingContent } from "@/features/landing";
import { usePublicPromotions } from "@/features/promotions/hooks/use-public-promotions";
import { cn } from "@/lib/utils";

const SECTION_HEADING = "text-center lg:text-left";

type LandingEventsProps = {
  content: LandingContent;
};

function formatEventDate(start: string | null, end: string | null): string | null {
  if (!start) return null;
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) return null;

  const dateFmt = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (!end || end === start) return dateFmt.format(startDate);

  const endDate = new Date(end);
  if (Number.isNaN(endDate.getTime())) return dateFmt.format(startDate);

  const sameMonth =
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear();

  if (sameMonth) {
    return `${startDate.getDate()}–${endDate.getDate()} ${dateFmt.format(endDate).split(" ").slice(1).join(" ")}`;
  }

  return `${dateFmt.format(startDate)} – ${dateFmt.format(endDate)}`;
}

export function LandingEvents({ content }: LandingEventsProps) {
  const { data: promotions = [] } = usePublicPromotions("events_section");
  const events =
    promotions.length > 0
      ? promotions.map((promo) => ({
          id: promo.id,
          title: promo.title,
          subtitle: null,
          description: promo.shortDescription ?? promo.fullDescription,
          bannerImageUrl: promo.bannerSrc,
          startDate: promo.startAt,
          endDate: promo.endAt,
          registrationLink: promo.registrationLink ?? promo.ctaLink,
          ctaLabel: promo.ctaText ?? "Register",
        }))
      : content.events;

  if (events.length === 0) return null;

  return (
    <section id="events" className={cn("bg-black", SPACING.section.md)}>
      <div className={LAYOUT.containerXl}>
        <FadeUp className={cn("mb-8 sm:mb-10", SECTION_HEADING)}>
          <Overline className="text-primary mb-3 block">Upcoming Events</Overline>
          <Display size="md" className="leading-[0.92] text-white">
            On the calendar
          </Display>
          <Text className="mx-auto mt-3 max-w-lg text-white/55 lg:mx-0">
            Tournaments, leagues, and special sessions at {content.displayName}.
          </Text>
        </FadeUp>

        <div className="grid gap-5 sm:grid-cols-2 lg:gap-6">
          {events.map((event, index) => {
            const dateLabel = formatEventDate(event.startDate, event.endDate);
            return (
              <Reveal key={event.id} delay={index * 0.05}>
                <article className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-white/10 bg-white/[0.03] transition-colors duration-300 hover:border-primary/25 hover:bg-white/[0.05]">
                  {event.bannerImageUrl ? (
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <Image
                        src={event.bannerImageUrl}
                        alt={event.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 50vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    </div>
                  ) : (
                    <div className="from-primary/15 to-primary/5 relative aspect-[16/9] bg-gradient-to-br">
                      <div className="stadium-glow absolute inset-0 opacity-60" />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    {event.subtitle ? (
                      <Overline className="text-primary mb-2 block text-[0.65rem]">
                        {event.subtitle}
                      </Overline>
                    ) : null}
                    <h3 className="font-display text-xl tracking-tight text-white uppercase">
                      {event.title}
                    </h3>
                    {dateLabel ? (
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-white/50">
                        <Calendar className="size-3.5 shrink-0" />
                        {dateLabel}
                      </p>
                    ) : null}
                    {event.description ? (
                      <Text size="sm" className="mt-3 flex-1 text-white/60">
                        {event.description}
                      </Text>
                    ) : null}
                    {event.registrationLink ? (
                      <div className="mt-5">
                        <Link href={event.registrationLink} target="_blank" rel="noopener noreferrer">
                          <Button
                            variant="booking"
                            size="sm"
                            className="touch-target min-h-11 w-full sm:w-auto"
                          >
                            {event.ctaLabel}
                            <ChevronRight className="size-4" />
                          </Button>
                        </Link>
                      </div>
                    ) : null}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
