import type { LucideIcon } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/design-system/card";
import { cn } from "@/lib/utils";

type StatsCardProps = {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: LucideIcon;
  className?: string;
};

export function StatsCard({
  label,
  value,
  change,
  trend = "neutral",
  icon: Icon,
  className,
}: StatsCardProps) {
  return (
    <Card variant="admin" padding="md" className={className}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-muted-foreground font-normal">{label}</CardTitle>
          {Icon ? <Icon className="text-muted-foreground size-4" strokeWidth={1.5} /> : null}
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-2xl font-semibold tracking-tight sm:text-3xl">{value}</p>
        {change ? (
          <p
            className={cn(
              "mt-1 text-xs font-medium",
              trend === "up" && "text-success",
              trend === "down" && "text-destructive",
              trend === "neutral" && "text-muted-foreground",
            )}
          >
            {change}
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}

type RevenueCardProps = {
  label: string;
  amount: string;
  period?: string;
  className?: string;
};

export function RevenueCard({ label, amount, period, className }: RevenueCardProps) {
  return (
    <Card variant="admin" padding="lg" className={cn("col-span-full sm:col-span-2", className)}>
      <CardHeader>
        <CardTitle className="text-muted-foreground font-normal">{label}</CardTitle>
        {period ? <p className="text-muted-foreground text-xs">{period}</p> : null}
      </CardHeader>
      <CardBody>
        <p className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{amount}</p>
      </CardBody>
    </Card>
  );
}

type AnalyticsCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function AnalyticsCard({
  title,
  description,
  children,
  action,
  className,
}: AnalyticsCardProps) {
  return (
    <Card variant="admin" padding="md" className={className}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            {description ? (
              <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>
            ) : null}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardBody className="mt-3">{children}</CardBody>
    </Card>
  );
}

type TableShellProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function TableShell({ children, className, ...props }: TableShellProps) {
  return (
    <div
      className={cn(
        "border-border/80 bg-card overflow-hidden rounded-[var(--radius-lg)] border",
        className,
      )}
      {...props}
    >
      <div className="scrollbar-hide overflow-x-auto">{children}</div>
    </div>
  );
}

export function TableHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "border-border/60 bg-muted/30 text-muted-foreground grid min-w-[48rem] gap-0 border-b text-xs font-medium tracking-wide uppercase",
        className,
      )}
    >
      {children}
    </div>
  );
}

type TableCellProps = {
  children: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  header?: boolean;
  truncate?: boolean;
};

export function TableCell({
  children,
  className,
  align = "left",
  header = false,
  truncate = true,
}: TableCellProps) {
  return (
    <div
      className={cn(
        "border-border/50 flex min-w-0 items-center overflow-hidden border-r px-3 last:border-r-0",
        header ? "py-3" : "py-3.5",
        align === "right" && "justify-end text-right",
        align === "center" && "justify-center text-center",
        className,
      )}
    >
      {truncate ? <div className="min-w-0 max-w-full truncate">{children}</div> : children}
    </div>
  );
}

export function TableRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "border-border/40 hover:bg-muted/20 grid min-w-[48rem] gap-0 border-b text-sm last:border-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

type FilterBarProps = {
  children: ReactNode;
  className?: string;
};

export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        "border-border/70 bg-card flex flex-col gap-3 rounded-[var(--radius-lg)] border p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FilterBarGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-wrap items-center gap-2", className)}>{children}</div>;
}
