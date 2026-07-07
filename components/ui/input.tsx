import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "border-input bg-background flex h-10 w-full min-w-0 rounded-[var(--radius-md)] border px-3 py-2 text-sm",
        "placeholder:text-muted-foreground/70",
        "transition-colors duration-200",
        "focus-visible:border-ring focus-visible:ring-ring/30 focus-visible:ring-2 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-45",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "sm:h-11 sm:px-4",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
