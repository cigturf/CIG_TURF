import { ShieldCheck } from "lucide-react";

import { Text } from "@/components/design-system";
import { cn } from "@/lib/utils";

type PaymentTrustBadgeProps = {
  className?: string;
};

export function PaymentTrustBadge({ className }: PaymentTrustBadgeProps) {
  return (
    <div
      className={cn(
        "border-border/60 bg-muted/30 flex items-start gap-3 rounded-[var(--radius-lg)] border p-4",
        className,
      )}
    >
      <ShieldCheck className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="min-w-0">
        <Text size="sm" className="font-semibold">
          Safe &amp; Secure Payments
        </Text>
        <Text size="sm" className="text-muted-foreground">
          Powered by Razorpay
        </Text>
      </div>
    </div>
  );
}
