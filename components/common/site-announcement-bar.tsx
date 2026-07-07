"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { Text } from "@/components/design-system";
import { useAnnouncementBar } from "@/features/promotions/hooks/use-public-promotions";

export function SiteAnnouncementBar() {
  const { data: announcement } = useAnnouncementBar();
  const [dismissed, setDismissed] = useState(false);

  if (!announcement || dismissed) return null;

  return (
    <div className="bg-primary text-primary-foreground relative z-50 px-4 py-2.5 text-center text-sm">
      <Text size="sm" className="font-medium text-inherit">
        {announcement.shortDescription ?? announcement.title}
      </Text>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 hover:bg-black/10"
        aria-label="Dismiss announcement"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
