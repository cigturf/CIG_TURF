"use client";

import { Drawer } from "vaul";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BottomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: BottomSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="bg-foreground/40 fixed inset-0 z-50 backdrop-blur-[2px]" />
        <Drawer.Content
          className={cn(
            "border-border/80 bg-background fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[90dvh] flex-col rounded-t-[var(--radius-2xl)] border shadow-[var(--shadow-xl)] outline-none",
            className,
          )}
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="bg-muted mx-auto mt-3 h-1 w-10 shrink-0 rounded-full" />
          {(title || description) && (
            <div className="border-border/60 border-b px-5 py-4 text-left">
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
    </Drawer.Root>
  );
}

export function BottomSheetClose({ children }: { children: ReactNode }) {
  return <Drawer.Close asChild>{children}</Drawer.Close>;
}
