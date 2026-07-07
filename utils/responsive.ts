import { BREAKPOINTS, type Breakpoint } from "@/config/breakpoints.config";

type MediaQueryOptions = {
  min?: Breakpoint;
  max?: Breakpoint;
};

/**
 * Builds a CSS media query string from breakpoint tokens.
 */
export function buildMediaQuery({ min, max }: MediaQueryOptions): string {
  const parts: string[] = [];

  if (min) {
    parts.push(`(min-width: ${BREAKPOINTS[min]}px)`);
  }

  if (max) {
    parts.push(`(max-width: ${BREAKPOINTS[max] - 1}px)`);
  }

  return parts.join(" and ");
}

export function minWidthQuery(breakpoint: Breakpoint): string {
  return buildMediaQuery({ min: breakpoint });
}

export function maxWidthQuery(breakpoint: Breakpoint): string {
  return buildMediaQuery({ max: breakpoint });
}

/**
 * Returns true when the viewport is at or above the given breakpoint.
 */
export function isBreakpointUp(width: number, breakpoint: Breakpoint): boolean {
  return width >= BREAKPOINTS[breakpoint];
}

/**
 * Returns true when the viewport is below the given breakpoint.
 */
export function isBreakpointDown(width: number, breakpoint: Breakpoint): boolean {
  return width < BREAKPOINTS[breakpoint];
}

/**
 * Classifies the current viewport width into a device category.
 * Mobile-first: defaults to mobile, upgrades as width increases.
 */
export function getDeviceType(width: number): "mobile" | "tablet" | "desktop" {
  if (width >= BREAKPOINTS.lg) return "desktop";
  if (width >= BREAKPOINTS.md) return "tablet";
  return "mobile";
}
