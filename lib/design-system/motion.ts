/**
 * CIG Motion System
 * Subtle, premium — Stripe/Linear polish with sports-campaign reveals
 */

export const EASING = {
  premium: [0.21, 0.47, 0.32, 0.98] as const,
  smooth: [0.4, 0, 0.2, 1] as const,
  snap: [0.25, 0.1, 0.25, 1] as const,
  out: [0, 0, 0.2, 1] as const,
  inOut: [0.4, 0, 0.6, 1] as const,
};

export const DURATION = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.35,
  moderate: 0.45,
  slow: 0.6,
  reveal: 0.75,
} as const;

export const SPRING = {
  snappy: { type: "spring" as const, stiffness: 400, damping: 30 },
  gentle: { type: "spring" as const, stiffness: 260, damping: 28 },
  sheet: { type: "spring" as const, stiffness: 320, damping: 32 },
};

export const REVEAL_OFFSET = { y: 14, yLg: 20, x: 12, scale: 0.98 } as const;

export const revealVariants = {
  hidden: { opacity: 0, y: REVEAL_OFFSET.y },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.moderate, ease: EASING.premium },
  },
};

export const revealVariantsReduced = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.fast } },
};

export const fadeUpVariants = {
  hidden: { opacity: 0, y: REVEAL_OFFSET.yLg },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slow, ease: EASING.premium },
  },
};

export const scaleVariants = {
  hidden: { opacity: 0, scale: REVEAL_OFFSET.scale },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION.normal, ease: EASING.snap },
  },
};

export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
};

export const staggerItemVariants = {
  hidden: { opacity: 0, y: REVEAL_OFFSET.y },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.normal, ease: EASING.premium },
  },
};

export const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.normal, ease: EASING.smooth } },
};

export const slideInRightVariants = {
  hidden: { opacity: 0, x: REVEAL_OFFSET.x },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.moderate, ease: EASING.out },
  },
};

export const PARALLAX = { subtle: 0.12, medium: 0.25, strong: 0.4 } as const;

/** Overlay enter/exit for modals and sheets */
export const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.fast } },
  exit: { opacity: 0, transition: { duration: DURATION.fast } },
};

export const sheetVariants = {
  hidden: { y: "100%" },
  visible: { y: 0, transition: SPRING.sheet },
  exit: { y: "100%", transition: { duration: DURATION.normal, ease: EASING.inOut } },
};
