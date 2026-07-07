import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("bg-muted/80 animate-pulse rounded-[var(--radius-md)]", className)}
      {...props}
    />
  );
}

export { Skeleton };
