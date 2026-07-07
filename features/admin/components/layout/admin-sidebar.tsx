"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Images,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  UserCircle,
  Users,
  ScrollText,
  Wallet,
  Mail,
  type LucideIcon,
} from "lucide-react";

import { ADMIN_NAV_ITEMS } from "@/features/admin/config/admin-navigation";
import { hasAdminPermission } from "@/features/admin/config/admin-permissions";
import { useAdminSidebar } from "@/features/admin/hooks/use-admin-sidebar";
import { useAdminShell } from "@/features/admin/providers/admin-shell-provider";
import { signOutClient } from "@/features/auth/hooks";
import { APP_EVENT_TYPES } from "@/features/events/constants/event-types";
import { useAppEventPublisher } from "@/features/events/hooks/use-app-event-publisher";
import { Button, Text } from "@/components/design-system";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  CalendarDays,
  Clock,
  IndianRupee,
  Images,
  Sparkles,
  Settings,
  BarChart3,
  Wallet,
  Users,
  ScrollText,
  UserCircle,
  Mail,
};

type AdminSidebarProps = {
  className?: string;
  onNavigate?: () => void;
};

export function AdminSidebar({ className, onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();
  const { admin } = useAdminShell();
  const { collapsed, toggleCollapsed } = useAdminSidebar();
  const publish = useAppEventPublisher();

  const navItems = ADMIN_NAV_ITEMS.filter((item) =>
    hasAdminPermission(admin.role, item.permission),
  ).filter((item) => item.id !== "profile");

  const handleLogout = async () => {
    publish(APP_EVENT_TYPES.AUTH_LOGOUT, {
      userId: admin.userId,
      email: admin.email,
      role: admin.role,
    });
    await signOutClient();
    window.location.href = "/";
  };

  return (
    <aside
      className={cn(
        "border-sidebar-border bg-sidebar text-sidebar-foreground flex h-full shrink-0 flex-col border-r transition-[width] duration-300 ease-out",
        collapsed ? "w-[4.5rem]" : "w-64 md:w-[4.5rem] lg:w-64",
        className,
      )}
    >
      <div
        className={cn(
          "border-sidebar-border flex h-14 items-center border-b px-3",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {!collapsed ? (
          <Text size="sm" className="font-semibold tracking-tight">
            Admin
          </Text>
        ) : null}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="text-sidebar-foreground hover:bg-sidebar-accent hidden lg:inline-flex"
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {navItems.map((item) => {
          const Icon = ICON_MAP[item.icon] ?? LayoutDashboard;
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-2",
              )}
            >
              <Icon className="size-4 shrink-0" strokeWidth={1.75} />
              {!collapsed ? (
                <span className="truncate md:sr-only lg:not-sr-only">{item.label}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-sidebar-border space-y-1 border-t p-2">
        <Link
          href="/admin/profile"
          onClick={onNavigate}
          className={cn(
            "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors",
            pathname.startsWith("/admin/profile") &&
              "bg-sidebar-accent text-sidebar-accent-foreground",
            collapsed && "justify-center px-2",
          )}
        >
          <UserCircle className="size-4 shrink-0" />
          {!collapsed ? <span className="md:sr-only lg:not-sr-only">Profile</span> : null}
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors",
            collapsed && "justify-center px-2",
          )}
        >
          <LogOut className="size-4 shrink-0" />
          {!collapsed ? <span className="md:sr-only lg:not-sr-only">Logout</span> : null}
        </button>
      </div>
    </aside>
  );
}
