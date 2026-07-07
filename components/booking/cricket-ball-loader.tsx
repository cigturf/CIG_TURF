"use client";

import { cn } from "@/lib/utils";

type CricketBallLoaderProps = {
  className?: string;
  size?: "sm" | "md";
};

/** Subtle cricket-ball inspired loading indicator */
export function CricketBallLoader({ className, size = "md" }: CricketBallLoaderProps) {
  const sizeClass = size === "sm" ? "size-5" : "size-8";
  return (
    <div
      className={cn("cricket-ball-loader relative rounded-full", sizeClass, className)}
      role="status"
      aria-label="Loading"
    >
      <div className="absolute inset-0 rounded-full bg-red-700/90" />
      <div className="absolute inset-[18%] rounded-full border border-white/30" />
      <div className="absolute top-1/2 right-0 left-0 h-px -translate-y-1/2 bg-white/25" />
    </div>
  );
}
