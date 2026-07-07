"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { DURATION, EASING } from "@/lib/design-system/motion";
import { cn } from "@/lib/utils";

type AnimatedStatValueProps = {
  value: number;
  format?: "number" | "currency";
  className?: string;
};

function formatValue(value: number, format: "number" | "currency") {
  if (format === "currency") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  }

  return value.toLocaleString("en-IN");
}

export function AnimatedStatValue({
  value,
  format = "number",
  className,
}: AnimatedStatValueProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-24px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const startTime = performance.now();
    const durationMs = DURATION.slow * 1000;

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [isInView, value]);

  return (
    <motion.span
      ref={ref}
      className={cn("text-2xl font-semibold tracking-tight sm:text-3xl", className)}
      initial={{ opacity: 0, y: 6 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: DURATION.fast, ease: EASING.smooth }}
    >
      {formatValue(display, format)}
    </motion.span>
  );
}
