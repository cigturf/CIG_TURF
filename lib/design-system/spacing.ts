/**
 * CIG Spacing System — mobile-first
 */

export const SPACING = {
  section: {
    sm: "py-6 sm:py-8",
    md: "py-8 sm:py-12 md:py-16",
    lg: "py-12 sm:py-16 md:py-20 lg:py-24",
    xl: "py-16 sm:py-20 md:py-24 lg:py-32",
  },
  stack: {
    xs: "gap-2 sm:gap-2.5",
    sm: "gap-3 sm:gap-4",
    md: "gap-4 sm:gap-5 md:gap-6",
    lg: "gap-6 sm:gap-8",
    xl: "gap-8 sm:gap-10",
  },
  inline: {
    sm: "gap-2 sm:gap-2.5",
    md: "gap-3 sm:gap-4",
    lg: "gap-4 sm:gap-5",
  },
  inset: {
    sm: "p-3 sm:p-4",
    md: "p-4 sm:p-5 md:p-6",
    lg: "p-5 sm:p-6 md:p-8",
  },
} as const;

export const LAYOUT = {
  container: "mx-auto w-full px-4 sm:px-6 lg:px-8",
  containerSm: "mx-auto w-full max-w-screen-sm px-4",
  containerMd: "mx-auto w-full max-w-screen-md px-4 sm:px-6",
  containerLg: "mx-auto w-full max-w-screen-lg px-4 sm:px-6 lg:px-8",
  containerXl: "mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8",
} as const;

export const MOBILE_FIRST = {
  touchTarget: "2.75rem",
  paddingX: "1rem",
  navHeight: "3.5rem",
  tabBarHeight: "4rem",
} as const;
