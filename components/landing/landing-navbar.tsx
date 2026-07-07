"use client";

import { Menu, Moon, Sun } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { BrandLogo } from "@/components/landing/brand-logo";
import { Button, DrawerPanel, DrawerRoot, LAYOUT } from "@/components/design-system";
import type { LandingContent } from "@/features/landing";
import { useColorMode } from "@/hooks/use-color-mode";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#top", label: "Home" },
  { href: "#gallery", label: "Gallery" },
  { href: "#pricing", label: "Pricing" },
  { href: "#facilities", label: "Facilities" },
  { href: "#contact", label: "Contact" },
] as const;

type LandingNavbarProps = {
  content: LandingContent;
};

export function LandingNavbar({ content }: LandingNavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { toggleTheme, isDark, isReady } = useColorMode();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-out",
          scrolled
            ? "border-b border-white/10 bg-black/75 shadow-lg shadow-black/20 backdrop-blur-xl"
            : "border-transparent bg-transparent",
        )}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div
          className={cn(LAYOUT.containerXl, "flex h-14 items-center justify-between gap-3 sm:h-16")}
        >
          <Link href="#top" className="group flex min-w-0 items-center gap-2.5">
            {content.logoUrl ? (
              <Image
                src={content.logoUrl}
                alt={content.displayName}
                width={36}
                height={36}
                className="size-8 shrink-0 rounded-[var(--radius-sm)] object-contain sm:size-9"
              />
            ) : (
              <BrandLogo priority size="nav" onDarkSurface alt={content.displayName} />
            )}
            <span className="truncate text-xs font-semibold tracking-wide text-white uppercase sm:text-sm">
              {content.displayName}
            </span>
          </Link>

          <nav className="mobile-hidden items-center gap-0.5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-[var(--radius-md)] px-2.5 py-2 text-sm font-medium text-white/70 transition-colors duration-300 hover:text-white lg:px-3"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            {isReady ? (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="touch-target text-white/75 hover:bg-white/10 hover:text-white"
              >
                {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
            ) : null}

            <Link href="/login?returnTo=%2Fcustomer" className="mobile-hidden">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/75 hover:bg-white/10 hover:text-white"
              >
                Login
              </Button>
            </Link>

            <Link href="#book" className="mobile-hidden">
              <Button variant="booking" size="sm">
                Book Now
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="icon-sm"
              className="touch-target text-white hover:bg-white/10 sm:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </Button>
          </div>
        </div>
      </header>

      <DrawerRoot open={menuOpen} onOpenChange={setMenuOpen}>
        <DrawerPanel title={content.displayName}>
          <div className="mb-6 flex items-center justify-center gap-2.5">
            <BrandLogo size="nav" onDarkSurface alt={content.displayName} />
            <span className="text-sm font-semibold tracking-wide uppercase">
              {content.displayName}
            </span>
          </div>
          <nav className="flex flex-col gap-0.5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="touch-target hover:bg-muted flex items-center rounded-[var(--radius-md)] px-3 py-3.5 text-base font-medium tracking-tight"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/login?returnTo=%2Fcustomer" onClick={() => setMenuOpen(false)}>
              <Button variant="outline" fullWidth className="mt-5">
                Login
              </Button>
            </Link>
            <Link href="#book" onClick={() => setMenuOpen(false)}>
              <Button variant="booking" fullWidth className="mt-2">
                Book Now
              </Button>
            </Link>
          </nav>
        </DrawerPanel>
      </DrawerRoot>
    </>
  );
}
