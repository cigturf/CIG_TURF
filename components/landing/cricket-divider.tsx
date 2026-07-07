"use client";

import { cn } from "@/lib/utils";

type CricketSeamDividerProps = {
  className?: string;
};

/** Subtle cricket-ball seam inspired section divider */
export function CricketSeamDivider({ className }: CricketSeamDividerProps) {
  return (
    <div
      className={cn("relative flex items-center justify-center py-1", className)}
      aria-hidden
    >
      <div className="h-px w-full max-w-xs bg-gradient-to-r from-transparent via-primary/35 to-transparent sm:max-w-md" />
      <div className="absolute size-1.5 rounded-full bg-primary/50 ring-2 ring-primary/20" />
    </div>
  );
}

type PitchCreaseSeparatorProps = {
  className?: string;
};

/** Pitch crease inspired horizontal rule */
export function PitchCreaseSeparator({ className }: PitchCreaseSeparatorProps) {
  return (
    <div className={cn("relative h-px w-full", className)} aria-hidden>
      <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
      <div className="absolute top-0 left-1/2 h-px w-24 -translate-x-1/2 bg-primary/40" />
    </div>
  );
}
