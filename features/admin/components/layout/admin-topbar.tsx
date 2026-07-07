"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu } from "lucide-react";
import Image from "next/image";

import { AdminNotificationsMenu } from "@/features/admin/components/notifications/admin-notifications-menu";
import { AdminProfileMenu } from "@/features/admin/components/profile/admin-profile-menu";
import { AdminCommandPalette } from "@/features/admin/search/components/admin-command-palette";
import { buildAdminBreadcrumbs } from "@/features/admin/utils/admin-breadcrumbs";
import { useAdminShell } from "@/features/admin/providers/admin-shell-provider";
import { RealtimeStatusIndicator } from "@/features/realtime/components/realtime-status-indicator";
import { BrandLogo } from "@/components/landing/brand-logo";
import { Button, Text } from "@/components/design-system";
import { useColorMode } from "@/hooks/use-color-mode";

type AdminTopbarProps = {
  onOpenMobileNav: () => void;
};

export function AdminTopbar({ onOpenMobileNav }: AdminTopbarProps) {
  const pathname = usePathname();
  const { admin, branding } = useAdminShell();
  const { toggleTheme, isDark, isReady } = useColorMode();
  const breadcrumbs = buildAdminBreadcrumbs(pathname ?? "/admin");

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="border-border/70 bg-background/90 sticky top-0 z-30 border-b backdrop-blur-md">
      <div className="flex h-14 items-center gap-3 px-4 sm:h-16 sm:px-6">
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </Button>

        <div className="hidden min-w-0 items-center gap-2.5 sm:flex">
          {branding.logoUrl ? (
            <Image
              src={branding.logoUrl}
              alt={branding.businessName}
              width={28}
              height={28}
              className="size-7 rounded-[var(--radius-sm)] object-contain"
            />
          ) : (
            <BrandLogo size="icon" className="size-7" alt={branding.businessName} />
          )}
          <div className="min-w-0">
            <Text size="sm" className="truncate font-semibold">
              {branding.businessName}
            </Text>
            <Text size="sm" className="text-muted-foreground hidden truncate md:block">
              Admin Console
            </Text>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Text size="sm" className="text-muted-foreground hidden xl:block">
            {today}
          </Text>
          <RealtimeStatusIndicator className="hidden sm:inline-flex" />
          <AdminCommandPalette />
          <AdminNotificationsMenu />
          {isReady ? (
            <Button variant="ghost" size="icon-sm" onClick={toggleTheme} aria-label="Toggle theme">
              <span className="text-xs font-medium">{isDark ? "☀" : "☾"}</span>
            </Button>
          ) : null}
          <AdminProfileMenu admin={admin} />
        </div>
      </div>

      <div className="border-border/60 hidden border-t px-4 py-2 sm:px-6 lg:block">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 ? (
                <ChevronRight className="text-muted-foreground size-3.5" aria-hidden />
              ) : null}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      </div>
    </header>
  );
}
