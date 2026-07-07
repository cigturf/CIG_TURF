import { TYPE_SCALE } from "@/lib/design-system/typography";
import { cn } from "@/lib/utils";

type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> & {
  level?: "h1" | "h2" | "h3" | "h4";
  muted?: boolean;
  as?: "h1" | "h2" | "h3" | "h4";
};

const levelMap = {
  h1: TYPE_SCALE.heading.h1,
  h2: TYPE_SCALE.heading.h2,
  h3: TYPE_SCALE.heading.h3,
  h4: TYPE_SCALE.heading.h4,
} as const;

export function Heading({ className, level = "h2", muted = false, as, ...props }: HeadingProps) {
  const Tag = as ?? level ?? "h2";
  return (
    <Tag
      className={cn(
        levelMap[level],
        muted ? "text-muted-foreground font-medium" : "text-foreground font-semibold",
        className,
      )}
      {...props}
    />
  );
}
