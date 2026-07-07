import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type DesktopNavProps = { children: ReactNode; className?: string };

export function DesktopNav({ children, className }: DesktopNavProps) {
  return (
    <header
      className={cn(
        "border-border/60 bg-background/80 hidden border-b backdrop-blur-md lg:block",
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-6 lg:px-8">
        {children}
      </div>
    </header>
  );
}

type DesktopNavItemProps = {
  href: string;
  label: string;
  active?: boolean;
  icon?: LucideIcon;
};

export function DesktopNavItem({ href, label, active, icon: Icon }: DesktopNavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
    >
      {Icon ? <Icon className="size-4" strokeWidth={1.5} /> : null}
      {label}
    </Link>
  );
}

export function DesktopNavGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <nav className={cn("flex items-center gap-1", className)}>{children}</nav>;
}

export function DesktopNavBrand({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("flex items-center gap-3", className)}>{children}</div>;
}

export function DesktopNavActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("flex items-center gap-2", className)}>{children}</div>;
}
