"use client";

import { Drawer } from "vaul";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type DrawerRootProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
};

export function DrawerRoot({ open, onOpenChange, children }: DrawerRootProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} direction="right">
      {children}
    </Drawer.Root>
  );
}

type DrawerPanelProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function DrawerPanel({ title, description, children, className }: DrawerPanelProps) {
  return (
    <Drawer.Portal>
      <Drawer.Overlay className="bg-foreground/40 fixed inset-0 z-50 backdrop-blur-[2px]" />
      <Drawer.Content
        className={cn(
          "border-border/80 bg-background fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l shadow-[var(--shadow-xl)]",
          "outline-none",
          className,
        )}
      >
        <div className="bg-muted mx-auto mt-3 hidden h-1 w-10 shrink-0 rounded-full lg:hidden" />
        {(title || description) && (
          <div className="border-border/60 border-b px-5 py-4">
            {title ? (
              <Drawer.Title className="text-base font-semibold">{title}</Drawer.Title>
            ) : null}
            {description ? (
              <Drawer.Description className="text-muted-foreground mt-1 text-sm">
                {description}
              </Drawer.Description>
            ) : null}
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </Drawer.Content>
    </Drawer.Portal>
  );
}

export function DrawerClose({ children }: { children: ReactNode }) {
  return <Drawer.Close asChild>{children}</Drawer.Close>;
}
