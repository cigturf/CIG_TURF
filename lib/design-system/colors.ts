/**
 * CIG Semantic Color Tokens
 * CSS variable references — runtime accent via --brand-accent from Settings
 */

export const SEMANTIC_COLORS = {
  primary: "text-primary bg-primary border-primary",
  secondary: "text-secondary-foreground bg-secondary",
  muted: "text-muted-foreground bg-muted",
  accent: "text-accent-foreground bg-accent",
  destructive: "text-destructive bg-destructive/10 border-destructive/20",
  success: "text-success bg-success/10 border-success/20",
  warning: "text-warning bg-warning/10 border-warning/20",
  info: "text-info bg-info/10 border-info/20",
  brand: "text-brand-accent",
} as const;

export const STATUS_COLORS = {
  pending: "bg-warning/15 text-warning border-warning/25",
  confirmed: "bg-success/15 text-success border-success/25",
  cancelled: "bg-destructive/15 text-destructive border-destructive/25",
  completed: "bg-info/15 text-info border-info/25",
  default: "bg-muted text-muted-foreground border-border",
} as const;

export type StatusVariant = keyof typeof STATUS_COLORS;

export const CSS_VARS = {
  brandAccent: "--brand-accent",
  stadiumGlow: "--stadium-glow",
  surfacePublic: "--surface-public",
  surfaceAdmin: "--surface-admin",
} as const;

/** Structural palette constants for documentation */
export const PALETTE = {
  turf: "oklch(0.52 0.13 155)",
  stadiumNight: "oklch(0.13 0.02 250)",
  floodlight: "oklch(0.95 0.02 85)",
} as const;
