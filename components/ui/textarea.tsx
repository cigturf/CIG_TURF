import * as React from "react";

import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "border-input bg-background flex min-h-[5rem] w-full rounded-[var(--radius-md)] border px-3 py-2.5 text-sm",
        "placeholder:text-muted-foreground/70",
        "resize-y transition-colors duration-200",
        "focus-visible:border-ring focus-visible:ring-ring/30 focus-visible:ring-2 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-45",
        "sm:min-h-[6rem] sm:px-4",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export { Textarea };
