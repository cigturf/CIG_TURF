"use client";

import { Play } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";

import { GalleryLightbox } from "@/components/landing/gallery-lightbox";
import {
  Display,
  LAYOUT,
  Overline,
  Reveal,
  SPACING,
  Text,
} from "@/components/design-system";
import { AppMediaImage } from "@/features/media/components/app-media-image";
import type { LandingContent, LandingGalleryItem } from "@/features/landing";
import { usePublicMedia } from "@/features/media/hooks/use-public-media";
import { normalizeAppMediaUrl } from "@/features/media/lib/normalize-media-url";
import type { MediaAssetPublic } from "@/features/media/types";
import { cn } from "@/lib/utils";

type LandingGalleryProps = {
  content: LandingContent;
};

const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov)(\?|$)/i;

function isVideoUrl(url: string | null): boolean {
  if (!url) return false;
  return VIDEO_EXTENSIONS.test(url);
}

function toGalleryItem(
  item: Pick<LandingGalleryItem, "id" | "url" | "alt" | "caption">,
): LandingGalleryItem | null {
  const url = normalizeAppMediaUrl(item.url) ?? item.url;
  if (!url) return null;

  return {
    id: item.id,
    url,
    alt: item.alt,
    caption: item.caption ?? null,
  };
}

type GalleryPhotoCardProps = {
  item: LandingGalleryItem;
  index: number;
  onSelect: (index: number) => void;
};

function GalleryPhotoCard({ item, index, onSelect }: GalleryPhotoCardProps) {
  if (!item.url) return null;

  const mediaUrl = item.url;
  const showVideo = isVideoUrl(mediaUrl);

  return (
    <button
      type="button"
      onClick={() => onSelect(index)}
      className={cn(
        "group w-36 shrink-0 text-left sm:w-40 md:w-44",
        "focus-visible:ring-primary rounded-xl focus-visible:ring-2 focus-visible:outline-none",
      )}
      aria-label={item.caption ?? item.alt ?? "Open gallery photo"}
    >
      <div className="rounded-xl border border-white/20 bg-white/10 p-2 shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition-transform duration-300 group-hover:-translate-y-0.5">
        <div className="relative aspect-[4/3] min-h-[6.5rem] overflow-hidden rounded-lg bg-black/50">
          {showVideo ? (
            <>
              <video
                className="size-full object-cover"
                src={mediaUrl}
                muted
                loop
                playsInline
                preload="metadata"
                aria-hidden
              />
              <div className="pointer-events-none absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-black/55 text-white">
                <Play className="size-3 fill-white" />
              </div>
            </>
          ) : (
            <AppMediaImage
                src={mediaUrl}
              alt={item.alt}
              fill
              loading="lazy"
              sizes="(max-width: 768px) 144px, 176px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
        </div>
        {item.caption ? (
          <p className="mt-2 line-clamp-2 px-0.5 text-[0.65rem] leading-snug text-white/70">
            {item.caption}
          </p>
        ) : null}
      </div>
    </button>
  );
}

function GallerySkeleton() {
  return (
    <div className="flex min-h-[8.5rem] justify-center gap-4 overflow-hidden py-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-[7.5rem] w-36 shrink-0 animate-pulse rounded-xl border border-white/10 bg-white/5 sm:w-40"
        />
      ))}
    </div>
  );
}

type GalleryPhotoSlideshowProps = {
  items: LandingGalleryItem[];
  onSelect: (index: number) => void;
};

function GalleryPhotoSlideshow({ items, onSelect }: GalleryPhotoSlideshowProps) {
  const reduced = useReducedMotion();
  const useMarquee = items.length > 3 && !reduced;
  const loop = items.length > 1 ? [...items, ...items] : items;
  const duration = Math.max(28, items.length * 6);

  if (!useMarquee) {
    return (
      <div className="min-h-[8.5rem] py-2">
        <div
          className={cn(
            "scrollbar-hide flex gap-4 overflow-x-auto pb-2",
            items.length <= 2 ? "justify-center" : "justify-start sm:justify-center",
          )}
        >
          {items.map((item, index) => (
            <GalleryPhotoCard key={item.id} item={item} index={index} onSelect={onSelect} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[8.5rem] overflow-hidden py-2">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-black to-transparent sm:w-12" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-black to-transparent sm:w-12" />
      <motion.div
        className="flex w-max gap-4 sm:gap-5"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
      >
        {loop.map((item, index) => (
          <GalleryPhotoCard
            key={`${item.id}-${index}`}
            item={item}
            index={index % items.length}
            onSelect={onSelect}
          />
        ))}
      </motion.div>
    </div>
  );
}

function mapPublicAssets(assets: MediaAssetPublic[]): LandingGalleryItem[] {
  return [...assets]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((asset) =>
      toGalleryItem({
        id: asset.id,
        url: asset.src,
        alt: asset.altText ?? asset.filename,
        caption: asset.caption,
      }),
    )
    .filter((item): item is LandingGalleryItem => item !== null);
}

export function LandingGallery({ content }: LandingGalleryProps) {
  const publicMediaQuery = usePublicMedia("gallery");
  const items = useMemo(() => {
    const galleryItems = publicMediaQuery.data;
    if (galleryItems && galleryItems.length > 0) {
      return mapPublicAssets(galleryItems);
    }

    return content.gallery
      .map((item) => toGalleryItem(item))
      .filter((item): item is LandingGalleryItem => item !== null);
  }, [publicMediaQuery.data, content.gallery]);

  const isLoading = publicMediaQuery.isLoading && items.length === 0;
  const hasGallery = items.length > 0;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <section id="gallery" className={cn("bg-black", SPACING.section.md)}>
      <div className={LAYOUT.containerXl}>
        <Reveal className="mb-4 text-center sm:mb-5 lg:mb-6 lg:text-left">
          <Overline className="text-primary mb-3 block">Gallery</Overline>
          <Display size="md" className="mb-3 leading-[0.92] text-white">
            Moments that <span className="text-primary">stay with you</span>
          </Display>
          <Text className="mx-auto max-w-lg text-white/55 lg:mx-0">
            {hasGallery
              ? `Real games. Real passion. Real memories from ${content.displayName}.`
              : "Gallery photos and videos will appear here once uploaded from the admin panel."}
          </Text>
        </Reveal>

        {isLoading ? (
          <GallerySkeleton />
        ) : hasGallery ? (
          <>
            <GalleryPhotoSlideshow items={items} onSelect={setLightboxIndex} />

            <GalleryLightbox
              items={items}
              activeIndex={lightboxIndex}
              onClose={() => setLightboxIndex(null)}
              onNavigate={setLightboxIndex}
            />
          </>
        ) : (
          <div className="rounded-[var(--radius-2xl)] border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center">
            <Text className="text-white/45">
              No gallery media yet. Upload images to the <strong>Gallery</strong> folder in Admin →
              Media and set visibility to <strong>Public</strong>.
            </Text>
          </div>
        )}
      </div>
    </section>
  );
}
