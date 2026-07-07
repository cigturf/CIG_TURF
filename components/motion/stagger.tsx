"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

import { staggerContainerVariants } from "@/lib/design-system/motion";
import { cn } from "@/lib/utils";

type StaggerProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
};

/**
 * Staggered children reveal — for feature lists, stats, gallery grids.
 */
export function Stagger({ children, className, ...props }: StaggerProps) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={cn(className)}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={staggerContainerVariants}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
