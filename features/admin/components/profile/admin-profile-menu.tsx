"use client";

import Link from "next/link";

import { formatAdminRole } from "@/features/admin/config/admin-permissions";
import type { AdminContext } from "@/features/admin/types/admin.types";
import { Button, Text } from "@/components/design-system";
import { cn } from "@/lib/utils";

type AdminProfileMenuProps = {
  admin: AdminContext;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AdminProfileMenu({ admin }: AdminProfileMenuProps) {
  return (
    <div className="group relative">
      <Button variant="ghost" size="icon-sm" className="rounded-full p-0" aria-label="Admin profile">
        {admin.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={admin.image}
            alt={admin.name}
            className="size-8 rounded-full object-cover"
          />
        ) : (
          <span className="bg-primary/15 text-primary flex size-8 items-center justify-center rounded-full text-xs font-semibold">
            {getInitials(admin.name)}
          </span>
        )}
      </Button>

      <div
        className={cn(
          "border-border/70 bg-popover absolute top-full right-0 z-50 mt-2 hidden w-64 rounded-[var(--radius-lg)] border p-3 shadow-[var(--shadow-lg)]",
          "group-focus-within:block group-hover:block",
        )}
      >
        <div className="mb-3 flex items-center gap-3">
          <span className="bg-primary/15 text-primary flex size-10 items-center justify-center rounded-full text-sm font-semibold">
            {getInitials(admin.name)}
          </span>
          <div className="min-w-0">
            <Text className="truncate font-semibold">{admin.name}</Text>
            <Text size="sm" className="text-muted-foreground truncate">
              {admin.email}
            </Text>
            <Text size="sm" className="text-primary mt-0.5 font-medium">
              {formatAdminRole(admin.role)}
            </Text>
          </div>
        </div>
        <Link href="/admin/profile">
          <Button variant="outline" size="sm" fullWidth>
            View profile
          </Button>
        </Link>
      </div>
    </div>
  );
}
