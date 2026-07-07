/**
 * Surface tokens for public (cinematic cricket) vs admin (minimal business) contexts.
 * Mobile-first: public surfaces default to full-width, edge-to-edge on small screens.
 */

export const SURFACES = {
  /** Landing / marketing — stadium atmosphere, cinematic */
  public: {
    base: "bg-background text-foreground",
    hero: "relative min-h-[100dvh] w-full overflow-hidden",
    section: "relative w-full",
    card: "rounded-lg border border-border/60 bg-card/80 sm:rounded-xl",
    overlay: "absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background",
    glow: "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--stadium-glow),transparent_60%)]",
  },
  /** Admin dashboard — clean, business-focused, no decorative effects */
  admin: {
    base: "bg-background text-foreground",
    section: "w-full",
    card: "rounded-lg border border-border bg-card",
    sidebar: "border-border bg-sidebar",
  },
} as const;

export type SurfaceContext = keyof typeof SURFACES;
