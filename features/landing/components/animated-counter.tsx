"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { DURATION, EASING } from "@/lib/design-system/motion";
import { cn } from "@/lib/utils";

type AnimatedCounterProps = {
  value: number | null;
  suffix?: string;
  duration?: number;
  className?: string;
};

export function AnimatedCounter({
  value,
  suffix = "",
  duration = DURATION.slow,
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView || value === null) return;

    let start = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * value);
      setDisplay(start);
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [isInView, value, duration]);

  if (value === null) {
    return (
      <span ref={ref} className={cn("font-display text-3xl font-semibold sm:text-4xl", className)}>
        —
      </span>
    );
  }

  return (
    <motion.span
      ref={ref}
      className={cn("font-display text-3xl font-semibold sm:text-4xl", className)}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: DURATION.fast, ease: EASING.smooth }}
    >
      {display}
      {suffix}
    </motion.span>
  );
}
