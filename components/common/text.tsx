import { TYPE_SCALE } from "@/lib/design-system/typography";
import { cn } from "@/lib/utils";

type TextProps = React.HTMLAttributes<HTMLParagraphElement> & {
  size?: "sm" | "base" | "lg";
  muted?: boolean;
};

const sizeMap = {
  sm: TYPE_SCALE.body.sm,
  base: TYPE_SCALE.body.md,
  lg: TYPE_SCALE.body.lg,
} as const;

export function Text({ className, size = "base", muted = false, ...props }: TextProps) {
  return (
    <p
      className={cn(
        "text-pretty",
        sizeMap[size],
        muted ? "text-muted-foreground" : "text-foreground",
        className,
      )}
      {...props}
    />
  );
}
