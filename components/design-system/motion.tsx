"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

import {
  DURATION,
  EASING,
  fadeUpVariants,
  fadeVariants,
  revealVariants,
  revealVariantsReduced,
  scaleVariants,
  slideInRightVariants,
  staggerContainerVariants,
  staggerItemVariants,
} from "@/lib/design-system/motion";
import { cn } from "@/lib/utils";

type MotionWrapperProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  delay?: number;
  once?: boolean;
};

export function Reveal({
  children,
  className,
  delay = 0,
  once = true,
  ...props
}: MotionWrapperProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-32px" }}
      variants={reduced ? revealVariantsReduced : revealVariants}
      transition={
        reduced ? undefined : { delay, duration: DURATION.moderate, ease: EASING.premium }
      }
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FadeUp({
  children,
  className,
  delay = 0,
  once = true,
  ...props
}: MotionWrapperProps) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={cn(className)}>{children}</div>;
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-32px" }}
      variants={fadeUpVariants}
      transition={{ delay, duration: DURATION.slow, ease: EASING.premium }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FadeIn({ children, className, delay = 0, ...props }: MotionWrapperProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={reduced ? revealVariantsReduced : fadeVariants}
      transition={{ delay, duration: DURATION.normal }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({
  children,
  className,
  delay = 0,
  once = true,
  ...props
}: MotionWrapperProps) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={cn(className)}>{children}</div>;
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-24px" }}
      variants={scaleVariants}
      transition={{ delay, duration: DURATION.normal, ease: EASING.snap }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function SlideIn({
  children,
  className,
  delay = 0,
  once = true,
  ...props
}: MotionWrapperProps) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={cn(className)}>{children}</div>;
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-24px" }}
      variants={slideInRightVariants}
      transition={{ delay, duration: DURATION.moderate, ease: EASING.out }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({ children, className, ...props }: MotionWrapperProps) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={cn(className)}>{children}</div>;
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-32px" }}
      variants={staggerContainerVariants}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, ...props }: MotionWrapperProps) {
  return (
    <motion.div variants={staggerItemVariants} className={cn(className)} {...props}>
      {children}
    </motion.div>
  );
}

export { Parallax } from "@/components/motion/parallax";
