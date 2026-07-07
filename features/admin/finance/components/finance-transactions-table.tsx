"use client";

import type { FinanceTransaction } from "@/features/admin/finance/types/finance.types";
import { Badge, TableShell, Text } from "@/components/design-system";
import { formatCurrency } from "@/utils";
import { cn } from "@/lib/utils";

type FinanceTransactionsTableProps = {
  transactions: FinanceTransaction[];
  onSelect: (transaction: FinanceTransaction) => void;
};

function formatMethod(method: string) {
  return method === "online" ? "Razorpay" : method.replace(/_/g, " ");
}

export function FinanceTransactionsTable({
  transactions,
  onSelect,
}: FinanceTransactionsTableProps) {
  if (transactions.length === 0) {
    return <Text className="text-muted-foreground">No transactions in this period.</Text>;
  }

  return (
    <>
      <div className="hidden lg:block">
        <TableShell>
          <table className="w-full min-w-[960px] text-sm">
            <thead className="bg-muted/40 text-muted-foreground text-left text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Booking</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Collected By</th>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr
                  key={txn.id}
                  className="border-border/60 hover:bg-muted/30 cursor-pointer border-t transition-colors"
                  onClick={() => onSelect(txn)}
                >
                  <td className="px-4 py-3">
                    {new Date(txn.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 font-medium">{txn.bookingReference}</td>
                  <td className="px-4 py-3">{txn.customerName}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(txn.amount)}</td>
                  <td className="px-4 py-3 capitalize">{formatMethod(txn.method)}</td>
                  <td className="px-4 py-3 capitalize">{txn.type}</td>
                  <td className="px-4 py-3">{txn.collectedBy ?? "—"}</td>
                  <td className="px-4 py-3">{txn.referenceNumber ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={txn.status === "refunded" ? "destructive" : "secondary"}>
                      {txn.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      </div>

      <div className="space-y-3 lg:hidden">
        {transactions.map((txn) => (
          <button
            key={txn.id}
            type="button"
            className="border-border/70 bg-card w-full rounded-[var(--radius-lg)] border p-4 text-left"
            onClick={() => onSelect(txn)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{txn.bookingReference}</p>
                <p className="text-muted-foreground mt-1 text-sm">{txn.customerName}</p>
              </div>
              <p className={cn("font-semibold", txn.status === "refunded" && "text-destructive")}>
                {formatCurrency(txn.amount)}
              </p>
            </div>
            <div className="text-muted-foreground mt-3 flex flex-wrap gap-2 text-xs">
              <span>{new Date(txn.createdAt).toLocaleString("en-IN")}</span>
              <span>·</span>
              <span className="capitalize">{formatMethod(txn.method)}</span>
              <span>·</span>
              <span className="capitalize">{txn.type}</span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
