import { SPACING } from "@/lib/design-system/spacing";
import { cn } from "@/lib/utils";

type SectionProps = React.HTMLAttributes<HTMLElement> & {
  spacing?: keyof typeof SPACING.section;
};

export function Section({ className, spacing = "md", ...props }: SectionProps) {
  return <section className={cn(SPACING.section[spacing], className)} {...props} />;
}
