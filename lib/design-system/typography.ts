/**
 * CIG Typography System
 * Mobile-first type scale — Geist (UI/body), Oswald (display/headlines)
 */

export const FONT_FAMILY = {
  sans: "font-sans",
  display: "font-display",
  mono: "font-mono",
} as const;

export const TYPE_SCALE = {
  /** Hero headlines — public landing */
  display: {
    xl: "font-display text-4xl font-semibold tracking-tight uppercase sm:text-5xl md:text-6xl lg:text-7xl",
    lg: "font-display text-3xl font-semibold tracking-tight uppercase sm:text-4xl md:text-5xl",
    md: "font-display text-2xl font-semibold tracking-tight uppercase sm:text-3xl md:text-4xl",
    sm: "font-display text-xl font-semibold tracking-tight uppercase sm:text-2xl",
  },
  /** Section headings */
  heading: {
    h1: "text-2xl font-semibold tracking-tight text-balance sm:text-3xl lg:text-4xl",
    h2: "text-xl font-semibold tracking-tight text-balance sm:text-2xl lg:text-3xl",
    h3: "text-lg font-semibold tracking-tight sm:text-xl",
    h4: "text-base font-semibold tracking-tight sm:text-lg",
  },
  /** Body copy */
  body: {
    lg: "text-base leading-relaxed text-pretty sm:text-lg",
    md: "text-sm leading-relaxed text-pretty sm:text-base",
    sm: "text-xs leading-relaxed sm:text-sm",
  },
  /** UI labels */
  label: {
    md: "text-sm font-medium",
    sm: "text-xs font-medium",
  },
  /** Overlines / eyebrows */
  overline: "text-[0.65rem] font-medium tracking-[0.2em] uppercase sm:text-xs",
  /** Captions / metadata */
  caption: "text-xs leading-normal text-muted-foreground sm:text-sm",
  /** Monospace — data, codes */
  mono: "font-mono text-xs tracking-tight sm:text-sm",
} as const;

export const TYPE_WEIGHT = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
} as const;
