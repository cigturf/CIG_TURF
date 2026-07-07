"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { Button, Dialog, DialogContent, DialogTitle } from "@/components/design-system";
import type { LandingGalleryItem } from "@/features/landing";
import { AppMediaImage } from "@/features/media/components/app-media-image";
import { cn } from "@/lib/utils";

const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov)(\?|$)/i;

function isVideoUrl(url: string | null): boolean {
  if (!url) return false;
  return VIDEO_EXTENSIONS.test(url);
}

type GalleryLightboxProps = {
  items: LandingGalleryItem[];
  activeIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

export function GalleryLightbox({ items, activeIndex, onClose, onNavigate }: GalleryLightboxProps) {
  const open = activeIndex !== null;
  const item = activeIndex !== null ? items[activeIndex] : null;
  const hasPrev = activeIndex !== null && activeIndex > 0;
  const hasNext = activeIndex !== null && activeIndex < items.length - 1;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className={cn(
          "flex h-[100dvh] max-h-[100dvh] w-full max-w-none flex-col gap-0 rounded-none border-0 p-0",
          "bg-black/95 sm:h-auto sm:max-h-[92vh] sm:max-w-5xl sm:rounded-[var(--radius-xl)]",
          "[&>button.absolute]:hidden",
        )}
      >
        <DialogTitle className="sr-only">Gallery preview</DialogTitle>
        <div className="flex items-center justify-between px-4 py-3 sm:px-5">
          <p className="text-sm font-medium text-white/80">
            {activeIndex !== null ? `${activeIndex + 1} / ${items.length}` : ""}
          </p>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close preview"
            className="text-white hover:bg-white/10 hover:text-white"
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="relative flex flex-1 items-center justify-center px-4 pb-4 sm:px-6 sm:pb-6">
          {hasPrev ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate(activeIndex! - 1)}
              aria-label="Previous"
              className="absolute left-2 z-10 text-white hover:bg-white/10 sm:left-4"
            >
              <ChevronLeft className="size-6" />
            </Button>
          ) : null}

          {item?.url ? (
            <div className="relative aspect-[4/5] w-full max-w-3xl sm:aspect-video">
              {isVideoUrl(item.url) ? (
                <video
                  src={item.url}
                  controls
                  playsInline
                  className="size-full rounded-[var(--radius-lg)] object-contain"
                  aria-label={item.alt}
                />
              ) : (
                <AppMediaImage
                  src={item.url}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 896px"
                  className="rounded-[var(--radius-lg)] object-contain"
                  priority
                />
              )}
            </div>
          ) : null}

          {hasNext ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate(activeIndex! + 1)}
              aria-label="Next"
              className="absolute right-2 z-10 text-white hover:bg-white/10 sm:right-4"
            >
              <ChevronRight className="size-6" />
            </Button>
          ) : null}
        </div>

        {item?.caption ? (
          <div className="border-t border-white/10 px-4 py-3 sm:px-6">
            <p className="text-center text-sm text-white/70">{item.caption}</p>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
