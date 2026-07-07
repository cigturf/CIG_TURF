"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

import {
  DURATION,
  EASING,
  revealVariants,
  revealVariantsReduced,
} from "@/lib/design-system/motion";
import { cn } from "@/lib/utils";

type RevealProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  delay?: number;
  once?: boolean;
};

/**
 * Scroll-triggered reveal animation — subtle upward fade.
 * Respects prefers-reduced-motion.
 */
export function Reveal({ children, className, delay = 0, once = true, ...props }: RevealProps) {
  const prefersReduced = useReducedMotion();
  const variants = prefersReduced ? revealVariantsReduced : revealVariants;

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-40px" }}
      variants={variants}
      transition={
        prefersReduced ? undefined : { delay, duration: DURATION.normal, ease: EASING.premium }
      }
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
