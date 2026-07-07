/**
 * CIG Elevation System
 * Subtle, premium shadows — no heavy drop shadows or glassmorphism
 */

export const ELEVATION = {
  none: "shadow-none",
  xs: "shadow-[var(--shadow-xs)]",
  sm: "shadow-[var(--shadow-sm)]",
  md: "shadow-[var(--shadow-md)]",
  lg: "shadow-[var(--shadow-lg)]",
  xl: "shadow-[var(--shadow-xl)]",
  /** Interactive lift on hover */
  hover: "transition-shadow duration-200 hover:shadow-[var(--shadow-md)]",
  /** Card resting state */
  card: "shadow-[var(--shadow-sm)]",
  /** Floating elements — modals, sheets */
  floating: "shadow-[var(--shadow-xl)]",
  /** Subtle inner depth */
  inset: "shadow-[inset_0_1px_0_0_oklch(1_0_0/0.04)]",
} as const;

export type ElevationLevel = keyof typeof ELEVATION;
