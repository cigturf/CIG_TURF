import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { ELEVATION } from "@/lib/design-system/elevation";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "relative overflow-hidden transition-[box-shadow,transform,border-color] duration-200",
  {
    variants: {
      variant: {
        default: "border border-border/70 bg-card text-card-foreground",
        elevated: cn("border border-border/50 bg-card text-card-foreground", ELEVATION.card),
        outline: "border border-border bg-transparent",
        ghost: "border border-transparent bg-muted/40",
        interactive: cn(
          "border border-border/70 bg-card cursor-pointer",
          ELEVATION.card,
          ELEVATION.hover,
          "hover:-translate-y-px active:translate-y-0",
        ),
        stadium: "border border-border/40 bg-card/90 backdrop-blur-[1px]",
        admin: "border border-border/80 bg-card",
      },
      padding: {
        none: "",
        sm: "p-3 sm:p-4",
        md: "p-4 sm:p-5 md:p-6",
        lg: "p-5 sm:p-6 md:p-8",
      },
      radius: {
        md: "rounded-[var(--radius-lg)]",
        lg: "rounded-[var(--radius-xl)]",
        xl: "rounded-[var(--radius-2xl)]",
      },
    },
    defaultVariants: { variant: "default", padding: "md", radius: "md" },
  },
);

type CardProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>;

export function Card({ className, variant, padding, radius, ...props }: CardProps) {
  return <div className={cn(cardVariants({ variant, padding, radius }), className)} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-sm font-semibold tracking-tight sm:text-base", className)} {...props} />
  );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-muted-foreground text-xs sm:text-sm", className)} {...props} />;
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center gap-2 pt-3", className)} {...props} />;
}

export { cardVariants };
