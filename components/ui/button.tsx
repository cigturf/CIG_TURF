import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2",
    "whitespace-nowrap font-medium",
    "outline-none select-none",
    "transition-[color,background,border,box-shadow,transform] duration-200",
    "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-45",
    "active:scale-[0.98]",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[var(--shadow-xs)] hover:bg-primary/90",
        premium: "bg-foreground text-background shadow-[var(--shadow-sm)] hover:bg-foreground/90",
        booking:
          "bg-brand-accent text-primary-foreground shadow-[var(--shadow-sm)] hover:brightness-110",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border border-border/80 bg-transparent hover:bg-muted/60 hover:border-border",
        ghost: "hover:bg-muted/70 hover:text-foreground",
        destructive:
          "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/15",
        link: "text-primary underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        xs: "h-7 rounded-[var(--radius-sm)] px-2.5 text-xs",
        sm: "h-9 rounded-[var(--radius-md)] px-3.5 text-sm",
        md: "h-10 rounded-[var(--radius-md)] px-4 text-sm sm:h-11 sm:px-5",
        lg: "h-11 rounded-[var(--radius-lg)] px-5 text-sm sm:h-12 sm:px-6 sm:text-base",
        xl: "h-12 rounded-[var(--radius-lg)] px-6 text-base sm:h-14 sm:px-8",
        icon: "size-10 rounded-[var(--radius-md)]",
        "icon-sm": "size-9 rounded-[var(--radius-md)]",
        "icon-lg": "size-11 rounded-[var(--radius-lg)]",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      fullWidth: false,
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  };

function Button({
  className,
  variant,
  size,
  fullWidth,
  asChild = false,
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  if (asChild) {
    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        {...props}
      >
        {children}
      </Comp>
    );
  }

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </Comp>
  );
}

export { Button, buttonVariants };
