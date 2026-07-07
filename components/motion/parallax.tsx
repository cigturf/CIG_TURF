"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type HTMLMotionProps,
} from "framer-motion";
import { useRef, type ReactNode } from "react";

import { PARALLAX } from "@/lib/design-system/motion";
import { cn } from "@/lib/utils";

type ParallaxProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  speed?: keyof typeof PARALLAX;
};

/**
 * Subtle parallax on scroll — stadium depth effect for hero sections.
 * Disabled when prefers-reduced-motion is active.
 */
export function Parallax({ children, className, speed = "subtle", ...props }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, PARALLAX[speed] * -100]);

  if (prefersReduced) {
    return (
      <div ref={ref} className={cn(className)}>
        {children}
      </div>
    );
  }

  return (
    <motion.div ref={ref} style={{ y }} className={cn(className)} {...props}>
      {children}
    </motion.div>
  );
}
