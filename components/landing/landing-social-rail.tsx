"use client";

import { Phone } from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";

import type { LandingContent } from "@/features/landing";
import { cn } from "@/lib/utils";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden
    >
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
      <circle cx="12" cy="12" r="4.25" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return <Phone className={className} strokeWidth={1.5} />;
}

type SocialLink = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

type LandingSocialRailProps = {
  content: LandingContent;
};

export function LandingSocialRail({ content }: LandingSocialRailProps) {
  const phone = content.contact.phones[0];
  const instagram = content.social.instagram;

  const links: SocialLink[] = [
    ...(instagram ? [{ href: instagram, label: "Instagram", icon: InstagramIcon }] : []),
    ...(phone ? [{ href: `tel:${phone}`, label: "Phone", icon: PhoneIcon }] : []),
  ];

  if (links.length === 0) return null;

  return (
    <div className="mobile-hidden fixed top-1/2 left-4 z-40 -translate-y-1/2">
      <div className="flex flex-col">
        {links.map(({ href, label, icon: Icon }, index) => (
          <Link
            key={label}
            href={href}
            target={href.startsWith("tel:") ? undefined : "_blank"}
            rel={href.startsWith("tel:") ? undefined : "noopener noreferrer"}
            aria-label={label}
            className={cn(
              "hover:border-primary/40 flex size-11 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/70 backdrop-blur-sm transition-colors hover:text-white",
              index > 0 && "mt-6",
            )}
          >
            <Icon className="size-4" />
          </Link>
        ))}
      </div>
    </div>
  );
}
