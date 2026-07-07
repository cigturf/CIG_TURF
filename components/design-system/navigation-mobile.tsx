"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type MobileNavProps = {
  children: ReactNode;
  className?: string;
};

/** Fixed top mobile navigation bar */
export function MobileNav({ children, className }: MobileNavProps) {
  return (
    <header
      className={cn(
        "border-border/60 bg-background/90 fixed inset-x-0 top-0 z-40 border-b backdrop-blur-md",
        "safe-area-inset-top",
        className,
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex h-14 items-center justify-between px-4 sm:h-16 sm:px-6">{children}</div>
    </header>
  );
}

type MobileNavItemProps = {
  href: string;
  icon?: LucideIcon;
  label: string;
  active?: boolean;
};

export function MobileNavItem({ href, icon: Icon, label, active }: MobileNavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center gap-0.5 px-2 py-1 text-[0.65rem] font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {Icon ? <Icon className="size-5" strokeWidth={active ? 2 : 1.5} /> : null}
      <span>{label}</span>
    </Link>
  );
}

type MobileTabBarProps = { children: ReactNode; className?: string };

/** Fixed bottom tab bar — BookMyShow-style mobile navigation */
export function MobileTabBar({ children, className }: MobileTabBarProps) {
  return (
    <nav
      className={cn(
        "border-border/60 bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-md",
        className,
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-16 items-stretch justify-around px-2">{children}</div>
    </nav>
  );
}

export function MobileNavSpacer() {
  return <div className="h-14 sm:h-16" />;
}

export function MobileTabBarSpacer() {
  return <div className="h-16" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />;
}
