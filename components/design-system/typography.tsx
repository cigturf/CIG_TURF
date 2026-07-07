import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { TYPE_SCALE } from "@/lib/design-system/typography";
import { cn } from "@/lib/utils";

const displayVariants = cva("font-display tracking-tight text-balance uppercase", {
  variants: {
    size: {
      xl: TYPE_SCALE.display.xl,
      lg: TYPE_SCALE.display.lg,
      md: TYPE_SCALE.display.md,
      sm: TYPE_SCALE.display.sm,
    },
    muted: { true: "text-muted-foreground", false: "text-foreground" },
  },
  defaultVariants: { size: "md", muted: false },
});

type DisplayProps = HTMLAttributes<HTMLHeadingElement> &
  VariantProps<typeof displayVariants> & { as?: "h1" | "h2" | "p" };

export function Display({ className, size, muted, as: Tag = "h1", ...props }: DisplayProps) {
  return <Tag className={cn(displayVariants({ size, muted }), className)} {...props} />;
}

const headingVariants = cva("tracking-tight text-balance", {
  variants: {
    level: {
      h1: TYPE_SCALE.heading.h1,
      h2: TYPE_SCALE.heading.h2,
      h3: TYPE_SCALE.heading.h3,
      h4: TYPE_SCALE.heading.h4,
    },
    muted: { true: "text-muted-foreground font-medium", false: "text-foreground font-semibold" },
  },
  defaultVariants: { level: "h2", muted: false },
});

type HeadingProps = HTMLAttributes<HTMLHeadingElement> &
  VariantProps<typeof headingVariants> & { as?: "h1" | "h2" | "h3" | "h4" };

export function Heading({ className, level = "h2", muted, as, ...props }: HeadingProps) {
  const Tag = as ?? level ?? "h2";
  return <Tag className={cn(headingVariants({ level, muted }), className)} {...props} />;
}

const textVariants = cva("text-pretty", {
  variants: {
    size: { lg: TYPE_SCALE.body.lg, md: TYPE_SCALE.body.md, sm: TYPE_SCALE.body.sm },
    muted: { true: "text-muted-foreground", false: "text-foreground" },
  },
  defaultVariants: { size: "md", muted: false },
});

type TextProps = HTMLAttributes<HTMLParagraphElement> & VariantProps<typeof textVariants>;

export function Text({ className, size, muted, ...props }: TextProps) {
  return <p className={cn(textVariants({ size, muted }), className)} {...props} />;
}

export function Overline({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn(TYPE_SCALE.overline, "text-muted-foreground", className)} {...props} />
  );
}

export function Caption({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn(TYPE_SCALE.caption, className)} {...props} />;
}
