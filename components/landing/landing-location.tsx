"use client";

import { MapPin, Phone } from "lucide-react";
import Link from "next/link";

import {
  Button,
  Display,
  LAYOUT,
  Overline,
  Reveal,
  SPACING,
  Text,
} from "@/components/design-system";
import { LANDING_PLACEHOLDERS } from "@/features/landing";
import type { LandingContent } from "@/features/landing";
import { cn } from "@/lib/utils";

type LandingLocationProps = {
  content: LandingContent;
};

export function LandingLocation({ content }: LandingLocationProps) {
  const { contact } = content;
  const hasMapLink = Boolean(contact.googleMapsLink);
  const hasMapEmbed = Boolean(contact.googleMapsEmbedUrl);
  const hasAddress = Boolean(contact.fullAddress);

  return (
    <section id="contact" className={cn("surface-public", SPACING.section.md)}>
      <div className={LAYOUT.containerXl}>
        <Reveal className="mb-6 text-center sm:mb-8 lg:text-left">
          <Overline className="text-primary mb-3 block">Location</Overline>
          <Display size="sm" className="leading-[0.92]">
            Find us easily
          </Display>
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          <Reveal className="lg:col-span-5">
            <div className="flex h-full flex-col justify-center gap-5 sm:gap-6">
              {hasAddress ? (
                <div className="flex gap-4">
                  <MapPin className="text-primary mt-0.5 size-5 shrink-0" strokeWidth={1.5} />
                  <div>
                    <p className="text-muted-foreground mb-1 text-[0.65rem] tracking-[0.2em] uppercase">
                      Address
                    </p>
                    <Text className="text-base leading-relaxed font-medium">
                      {contact.fullAddress}
                    </Text>
                  </div>
                </div>
              ) : (
                <Text muted>Address will appear once configured in settings.</Text>
              )}

              {contact.phones.map((phone) => (
                <div key={phone} className="flex gap-4">
                  <Phone className="text-primary size-5 shrink-0" strokeWidth={1.5} />
                  <div>
                    <p className="text-muted-foreground mb-1 text-[0.65rem] tracking-[0.2em] uppercase">
                      Phone
                    </p>
                    <Link
                      href={`tel:${phone}`}
                      className="touch-target inline-flex text-base font-medium hover:underline"
                    >
                      {phone}
                    </Link>
                  </div>
                </div>
              ))}

              <div className="flex flex-wrap gap-3 pt-1">
                {contact.whatsapp ? (
                  <Link
                    href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="touch-target">
                      WhatsApp
                    </Button>
                  </Link>
                ) : null}

                {hasMapLink ? (
                  <Link href={contact.googleMapsLink!} target="_blank" rel="noopener noreferrer">
                    <Button variant="booking" size="sm" className="touch-target">
                      Open in Google Maps
                    </Button>
                  </Link>
                ) : null}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="lg:col-span-7">
            <div className="relative overflow-hidden rounded-[var(--radius-2xl)] ring-1 ring-black/5">
              {hasMapEmbed ? (
                <iframe
                  src={contact.googleMapsEmbedUrl!}
                  title={`Map — ${content.displayName}`}
                  className="aspect-[4/3] w-full border-0 sm:aspect-[16/10]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              ) : (
                <div className="bg-muted/60 flex aspect-[4/3] items-center justify-center sm:aspect-[16/10]">
                  <Text muted className="px-6 text-center text-sm">
                    {LANDING_PLACEHOLDERS.location.mapPlaceholder}
                  </Text>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
