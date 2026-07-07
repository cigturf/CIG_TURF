import { Heading, Text } from "@/components/design-system";

type AdminPlaceholderPageProps = {
  title: string;
  description: string;
};

export function AdminPlaceholderPage({ title, description }: AdminPlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <Heading level="h3" className="mb-2">
        {title}
      </Heading>
      <Text className="text-muted-foreground mb-8">{description}</Text>
      <div className="border-border/70 bg-card rounded-[var(--radius-xl)] border border-dashed p-8 text-center">
        <Text className="text-muted-foreground">
          Module shell ready. Business logic will be implemented in a future milestone.
        </Text>
      </div>
    </div>
  );
}
