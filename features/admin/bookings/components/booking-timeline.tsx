"use client";

import { Check, Circle, Clock3 } from "lucide-react";

import type { BookingTimelineStep } from "@/features/admin/bookings/types/admin-booking.types";
import { Text } from "@/components/design-system";
import { cn } from "@/lib/utils";

type BookingTimelineProps = {
  steps: BookingTimelineStep[];
};

function TimelineIcon({ status }: { status: BookingTimelineStep["status"] }) {
  if (status === "completed") {
    return (
      <span className="bg-success/15 text-success flex size-7 items-center justify-center rounded-full">
        <Check className="size-3.5" />
      </span>
    );
  }

  if (status === "current") {
    return (
      <span className="bg-primary/15 text-primary flex size-7 items-center justify-center rounded-full">
        <Clock3 className="size-3.5" />
      </span>
    );
  }

  if (status === "skipped") {
    return (
      <span className="bg-muted text-muted-foreground flex size-7 items-center justify-center rounded-full">
        <Circle className="size-3.5" />
      </span>
    );
  }

  return (
    <span className="border-border text-muted-foreground flex size-7 items-center justify-center rounded-full border">
      <Circle className="size-3.5" />
    </span>
  );
}

export function BookingTimeline({ steps }: BookingTimelineProps) {
  return (
    <div className="space-y-0">
      {steps.map((step, index) => (
        <div key={step.id} className="relative flex gap-3 pb-6 last:pb-0">
          {index < steps.length - 1 ? (
            <span
              className={cn(
                "absolute top-7 left-3.5 h-[calc(100%-1.75rem)] w-px -translate-x-1/2",
                step.status === "completed" ? "bg-success/40" : "bg-border",
              )}
            />
          ) : null}
          <TimelineIcon status={step.status} />
          <div className="min-w-0 flex-1 pt-0.5">
            <Text className="font-medium">{step.label}</Text>
            {step.description ? (
              <Text size="sm" className="text-muted-foreground mt-0.5">
                {step.description}
              </Text>
            ) : null}
            {step.timestamp ? (
              <Text size="sm" className="text-muted-foreground mt-1">
                {new Date(step.timestamp).toLocaleString("en-IN")}
              </Text>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
