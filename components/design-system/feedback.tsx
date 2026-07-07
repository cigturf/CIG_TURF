import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
  children?: ReactNode;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-4 py-10 text-center sm:py-14",
        className,
      )}
    >
      {Icon ? (
        <div className="bg-muted/60 mb-4 flex size-12 items-center justify-center rounded-[var(--radius-lg)] sm:size-14">
          <Icon className="text-muted-foreground size-5 sm:size-6" strokeWidth={1.5} />
        </div>
      ) : null}
      <h3 className="text-sm font-semibold tracking-tight sm:text-base">{title}</h3>
      {description ? (
        <p className="text-muted-foreground mt-1.5 max-w-xs text-xs sm:text-sm">{description}</p>
      ) : null}
      {children}
      {action ? (
        <Button variant="outline" size="sm" className="mt-5" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}

type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this content. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "border-destructive/20 bg-destructive/5 flex flex-col items-center justify-center rounded-[var(--radius-lg)] border px-4 py-8 text-center sm:py-10",
        className,
      )}
    >
      <h3 className="text-destructive text-sm font-semibold sm:text-base">{title}</h3>
      <p className="text-muted-foreground mt-1.5 max-w-sm text-xs sm:text-sm">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
