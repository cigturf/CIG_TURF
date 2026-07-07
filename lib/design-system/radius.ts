/**
 * CIG Radius System
 * Consistent corner radii — slightly tighter than default shadcn for a sharper, premium feel
 */

export const RADIUS = {
  none: "rounded-none",
  xs: "rounded-[var(--radius-xs)]",
  sm: "rounded-[var(--radius-sm)]",
  md: "rounded-[var(--radius-md)]",
  lg: "rounded-[var(--radius-lg)]",
  xl: "rounded-[var(--radius-xl)]",
  "2xl": "rounded-[var(--radius-2xl)]",
  full: "rounded-full",
} as const;

export type RadiusLevel = keyof typeof RADIUS;

/** Context-specific radius presets */
export const RADIUS_PRESET = {
  button: RADIUS.md,
  input: RADIUS.md,
  card: RADIUS.lg,
  modal: RADIUS.xl,
  sheet: RADIUS["2xl"],
  badge: RADIUS.full,
  slot: RADIUS.md,
} as const;
