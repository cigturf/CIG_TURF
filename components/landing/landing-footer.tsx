"use client";

import Image from "next/image";
import Link from "next/link";

import { BrandLogo } from "@/components/landing/brand-logo";
import { LAYOUT, Separator, SPACING, Text } from "@/components/design-system";
import { LANDING_FOOTER_ARTWORK } from "@/features/landing";
import type { LandingContent } from "@/features/landing";
import { cn } from "@/lib/utils";

type LandingFooterProps = {
  content: LandingContent;
};

const SOCIAL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "X",
  youtube: "YouTube",
  whatsapp: "WhatsApp",
  linkedin: "LinkedIn",
};

export function LandingFooter({ content }: LandingFooterProps) {
  const year = new Date().getFullYear();
  const copyright =
    content.footer.copyright ?? `© ${year} ${content.displayName}. All rights reserved.`;

  const socialLinks = Object.entries(content.social).filter(
    ([, url]) => url !== null && url !== "",
  ) as [string, string][];

  return (
    <footer className="relative overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
        <Image
          src={LANDING_FOOTER_ARTWORK.src}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-right-bottom"
          aria-hidden
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/95 to-black/90" />

      <div className={cn(LAYOUT.containerXl, SPACING.section.md, "relative")}>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <div className="mb-4 flex items-center gap-2.5">
              <BrandLogo size="nav" onDarkSurface alt={content.displayName} />
              <span className="text-sm font-semibold tracking-wide text-white uppercase sm:text-base">
                {content.displayName}
              </span>
            </div>
            {content.footer.tagline ? (
              <Text size="sm" className="max-w-sm text-white/55">
                {content.footer.tagline}
              </Text>
            ) : (
              <Text size="sm" className="max-w-sm text-white/55">
                India&apos;s premium indoor cricket experience.
              </Text>
            )}
          </div>

          <div className="lg:col-span-3">
            <p className="mb-4 text-[0.65rem] tracking-[0.2em] text-white/40 uppercase">Contact</p>
            {content.contact.fullAddress ? (
              <Text size="sm" className="leading-relaxed text-white/65">
                {content.contact.fullAddress}
              </Text>
            ) : null}
            {content.contact.phones.length > 0 ? (
              <div className="mt-3 space-y-1">
                {content.contact.phones.map((phone) => (
                  <Link
                    key={phone}
                    href={`tel:${phone}`}
                    className="block text-sm font-medium text-white/85 hover:underline"
                  >
                    {phone}
                  </Link>
                ))}
              </div>
            ) : null}
            {content.contact.whatsapps.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-3">
                {content.contact.whatsapps.map((whatsapp) => (
                  <Link
                    key={whatsapp}
                    href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-white/85 hover:underline"
                  >
                    WhatsApp {whatsapp}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-4">
            <p className="mb-4 text-[0.65rem] tracking-[0.2em] text-white/40 uppercase">Follow</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {socialLinks.map(([key, url]) => (
                <Link
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/65 transition-colors duration-300 hover:text-white"
                >
                  {SOCIAL_LABELS[key] ?? key}
                </Link>
              ))}
              {socialLinks.length === 0 ? (
                <Text size="sm" className="text-white/45">
                  Social links will appear once configured.
                </Text>
              ) : null}
            </div>
          </div>
        </div>

        {content.footer.links.length > 0 ? (
          <div className="mt-8 flex flex-wrap gap-5">
            {content.footer.links.map((link) => (
              <Link
                key={link.url}
                href={link.url}
                className="text-xs text-white/45 transition-colors hover:text-white/75"
              >
                {link.label}
              </Link>
            ))}
          </div>
        ) : null}

        <Separator className="my-8 bg-white/10" />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Text size="sm" className="text-white/40">
            {copyright}
          </Text>
          <Text size="sm" className="text-white/35">
            Built with passion for cricket
          </Text>
        </div>
      </div>
    </footer>
  );
}
