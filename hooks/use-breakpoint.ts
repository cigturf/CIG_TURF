"use client";

import { useEffect, useState } from "react";

import { type Breakpoint, BREAKPOINTS } from "@/config/breakpoints.config";
import { buildMediaQuery } from "@/utils/responsive";

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return mounted ? matches : false;
}

/** Returns true when viewport is at or above the given breakpoint. */
export function useBreakpointUp(breakpoint: Breakpoint) {
  return useMediaQuery(buildMediaQuery({ min: breakpoint }));
}

/** Returns true when viewport is below the given breakpoint. */
export function useBreakpointDown(breakpoint: Breakpoint) {
  return useMediaQuery(buildMediaQuery({ max: breakpoint }));
}

/** @deprecated Use useBreakpointUp instead */
export function useBreakpoint(breakpoint: Breakpoint) {
  return useBreakpointUp(breakpoint);
}

/** Returns the current device category based on viewport width. */
export function useDeviceType(): "mobile" | "tablet" | "desktop" {
  const isDesktop = useBreakpointUp("lg");
  const isTablet = useBreakpointUp("md");

  if (isDesktop) return "desktop";
  if (isTablet) return "tablet";
  return "mobile";
}

/** Returns the current viewport width in pixels. */
export function useViewportWidth() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return width;
}

export { BREAKPOINTS, type Breakpoint };
