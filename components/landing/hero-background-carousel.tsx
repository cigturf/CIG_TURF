"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { DURATION, EASING } from "@/lib/design-system/motion";
import type { LandingArtwork } from "@/features/landing/lib/landing-artwork";
import { cn } from "@/lib/utils";

const ROTATE_MS = 7000;

type HeroBackgroundCarouselProps = {
  slides: LandingArtwork[];
  className?: string;
};

export function HeroBackgroundCarousel({ slides, className }: HeroBackgroundCarouselProps) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduced || slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [reduced, slides.length]);

  const slide = slides[index]!;

  return (
    <div className={cn("absolute inset-0", className)}>
      <AnimatePresence mode="sync">
        <motion.div
          key={slide.src}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: reduced ? 0 : DURATION.slow, ease: EASING.smooth },
            scale: { duration: reduced ? 0 : ROTATE_MS / 1000, ease: EASING.smooth },
          }}
          className="absolute inset-0"
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            priority={index === 0}
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
