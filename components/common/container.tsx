import { LAYOUT } from "@/lib/design-system/spacing";
import { cn } from "@/lib/utils";

type ContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
};

const sizeMap = {
  sm: LAYOUT.containerSm,
  md: LAYOUT.containerMd,
  lg: LAYOUT.containerLg,
  xl: LAYOUT.containerXl,
  "2xl": `${LAYOUT.containerXl} max-w-screen-2xl`,
  full: "max-w-full",
} as const;

export function Container({ className, size = "xl", ...props }: ContainerProps) {
  return <div className={cn(sizeMap[size], className)} {...props} />;
}
