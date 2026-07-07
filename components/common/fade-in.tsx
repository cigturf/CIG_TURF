"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

import { DURATION, EASING } from "@/lib/design-system/motion";
import { cn } from "@/lib/utils";

type FadeInProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  delay?: number;
};

/** Immediate fade-in — for above-the-fold content on page load */
export function FadeIn({ children, className, delay = 0, ...props }: FadeInProps) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: prefersReduced ? 1 : 0, y: prefersReduced ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        prefersReduced
          ? { duration: 0 }
          : { duration: DURATION.normal, delay, ease: EASING.premium }
      }
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
