"use client";

import { Menu, Moon, Sun } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { BrandLogo } from "@/components/landing/brand-logo";
import { useConfigContext } from "@/components/providers/config-provider";
import { Button, DrawerPanel, DrawerRoot, LAYOUT } from "@/components/design-system";
import { MobileNavSpacer } from "@/components/design-system/navigation-mobile";
import { useAuthSession } from "@/features/auth/hooks";
import { AUTH_ROUTES } from "@/features/auth/types";
import { buildLoginUrl } from "@/features/auth/utils/redirect";
import { useColorMode } from "@/hooks/use-color-mode";
import { cn } from "@/lib/utils";

const LANDING_LINKS = [
  { href: "/#top", label: "Home" },
  { href: "/#gallery", label: "Gallery" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#facilities", label: "Facilities" },
  { href: "/#contact", label: "Contact" },
] as const;

const APP_LINKS = [
  { href: "/", label: "Home" },
  { href: "/book", label: "Book" },
  { href: AUTH_ROUTES.customer, label: "My Account" },
] as const;

type SiteNavbarProps = {
  className?: string;
};

export function SiteNavbar({ className }: SiteNavbarProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const isLanding = pathname === "/";
  const { displayName, publicSettings } = useConfigContext();
  const { isAuthenticated, isPending } = useAuthSession();
  const { toggleTheme, isDark, isReady } = useColorMode();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const logoUrl = publicSettings.branding.logoUrl;
  const navLinks = isLanding ? LANDING_LINKS : APP_LINKS;
  const loginHref = buildLoginUrl(pathname || AUTH_ROUTES.customer);

  useEffect(() => {
    if (!isLanding) {
      setScrolled(true);
      return;
    }

    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isLanding]);

  if (isAdminRoute) {
    return null;
  }

  const logoHref = isLanding ? "/#top" : "/";
  const bookHref = isLanding ? "/#book" : "/book";

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          isLanding
            ? scrolled
              ? "border-b border-white/10 bg-black/75 shadow-lg shadow-black/20 backdrop-blur-xl"
              : "border-transparent bg-transparent"
            : "border-border/60 bg-background/90 border-b shadow-sm backdrop-blur-md",
          className,
        )}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div
          className={cn(LAYOUT.containerXl, "flex h-14 items-center justify-between gap-3 sm:h-16")}
        >
          <Link href={logoHref} className="group flex min-w-0 items-center gap-2.5">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={displayName}
                width={36}
                height={36}
                className="size-8 shrink-0 rounded-[var(--radius-sm)] object-contain sm:size-9"
              />
            ) : (
              <BrandLogo
                size="nav"
                onDarkSurface={isLanding}
                alt={displayName}
                logoUrl={logoUrl}
              />
            )}
            <span
              className={cn(
                "truncate text-xs font-semibold tracking-wide uppercase sm:text-sm",
                isLanding ? "text-white" : "text-foreground",
              )}
            >
              {displayName}
            </span>
          </Link>

          <nav className="mobile-hidden flex items-center gap-0.5">
            {navLinks.map((link) => {
              const active =
                !isLanding &&
                (link.href === pathname ||
                  (link.href !== "/" && pathname.startsWith(link.href)));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-[var(--radius-md)] px-2.5 py-2 text-sm font-medium transition-colors lg:px-3",
                    isLanding
                      ? "text-white/70 hover:text-white"
                      : active
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            {isReady ? (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className={cn(
                  "touch-target",
                  isLanding
                    ? "text-white/75 hover:bg-white/10 hover:text-white"
                    : "text-muted-foreground",
                )}
              >
                {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
            ) : null}

            {!isPending && !isAuthenticated ? (
              <Link href={loginHref} className="mobile-hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    isLanding
                      ? "text-white/75 hover:bg-white/10 hover:text-white"
                      : undefined,
                  )}
                >
                  Login
                </Button>
              </Link>
            ) : null}

            {!isPending && isAuthenticated ? (
              <Link href={AUTH_ROUTES.customer} className="mobile-hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    isLanding
                      ? "text-white/75 hover:bg-white/10 hover:text-white"
                      : undefined,
                  )}
                >
                  Account
                </Button>
              </Link>
            ) : null}

            <Link href={bookHref} className="mobile-hidden">
              <Button variant="booking" size="sm">
                Book Now
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(
                "touch-target sm:hidden",
                isLanding ? "text-white hover:bg-white/10" : "text-foreground",
              )}
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </Button>
          </div>
        </div>
      </header>

      <DrawerRoot open={menuOpen} onOpenChange={setMenuOpen}>
        <DrawerPanel title={displayName}>
          <div className="mb-6 flex items-center justify-center gap-2.5">
            <BrandLogo size="nav" alt={displayName} logoUrl={logoUrl} />
            <span className="text-sm font-semibold tracking-wide uppercase">{displayName}</span>
          </div>
          <nav className="flex flex-col gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="touch-target hover:bg-muted flex items-center rounded-[var(--radius-md)] px-3 py-3.5 text-base font-medium tracking-tight"
              >
                {link.label}
              </Link>
            ))}
            {!isPending && !isAuthenticated ? (
              <Link href={loginHref} onClick={() => setMenuOpen(false)}>
                <Button variant="outline" fullWidth className="mt-5">
                  Login
                </Button>
              </Link>
            ) : null}
            {!isPending && isAuthenticated ? (
              <Link href={AUTH_ROUTES.customer} onClick={() => setMenuOpen(false)}>
                <Button variant="outline" fullWidth className="mt-5">
                  My Account
                </Button>
              </Link>
            ) : null}
            <Link href={bookHref} onClick={() => setMenuOpen(false)}>
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

export function SiteNavbarSpacer() {
  const pathname = usePathname();
  if (!pathname || pathname === "/" || pathname.startsWith("/admin")) return null;
  return <MobileNavSpacer />;
}
