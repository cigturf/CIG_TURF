"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type ReportsSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
};

export function ReportsSection({
  title,
  description,
  children,
  defaultOpen = true,
  className,
}: ReportsSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={cn("space-y-4", className)}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 text-left lg:pointer-events-none"
        onClick={() => setOpen((current) => !current)}
      >
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {description ? <p className="text-muted-foreground mt-0.5 text-sm">{description}</p> : null}
        </div>
        <ChevronDown
          className={cn(
            "text-muted-foreground size-5 shrink-0 transition-transform lg:hidden",
            open && "rotate-180",
          )}
        />
      </button>
      <div className={cn("space-y-4", !open && "hidden lg:block")}>{children}</div>
    </section>
  );
}

type SwipeableChartsProps = {
  children: ReactNode;
};

export function SwipeableCharts({ children }: SwipeableChartsProps) {
  return (
    <div className="scrollbar-hide -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 lg:mx-0 lg:grid lg:grid-cols-2 lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0">
      {children}
    </div>
  );
}

export function SwipeableChartItem({ children }: { children: ReactNode }) {
  return <div className="min-w-[88vw] shrink-0 snap-center sm:min-w-[420px] lg:min-w-0">{children}</div>;
}
