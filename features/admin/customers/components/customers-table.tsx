"use client";

import type { CustomerListItem } from "@/features/admin/customers/types/customer.types";
import { formatCustomerStatus } from "@/features/admin/customers/lib/customer-aggregation";
import { formatBookingDateLabel } from "@/features/admin/bookings/lib/booking-utils";
import { Badge, TableShell, Text } from "@/components/design-system";
import { formatCurrency } from "@/utils";
import { cn } from "@/lib/utils";

type CustomersTableProps = {
  customers: CustomerListItem[];
  onSelect: (customer: CustomerListItem) => void;
};

function statusVariant(status: CustomerListItem["status"]) {
  switch (status) {
    case "pending":
      return "warning" as const;
    case "repeat":
      return "success" as const;
    case "new":
      return "info" as const;
    default:
      return "secondary" as const;
  }
}

export function CustomersTable({ customers, onSelect }: CustomersTableProps) {
  if (customers.length === 0) {
    return <Text className="text-muted-foreground">No customers match your search.</Text>;
  }

  return (
    <>
      <div className="hidden lg:block">
        <TableShell>
          <table className="w-full min-w-[960px] text-sm">
            <thead className="bg-muted/40 text-muted-foreground text-left text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 font-medium">Customer Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Total Bookings</th>
                <th className="px-4 py-3 font-medium">Last Booking</th>
                <th className="px-4 py-3 font-medium">Total Spent</th>
                <th className="px-4 py-3 font-medium">Outstanding</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer.customerKey}
                  className="border-border/60 hover:bg-muted/30 cursor-pointer border-t transition-colors"
                  onClick={() => onSelect(customer)}
                >
                  <td className="px-4 py-3 font-medium">{customer.name}</td>
                  <td className="px-4 py-3">{customer.phone}</td>
                  <td className="px-4 py-3">{customer.email || "—"}</td>
                  <td className="px-4 py-3">{customer.totalBookings}</td>
                  <td className="px-4 py-3">
                    {customer.lastBookingDate
                      ? formatBookingDateLabel(customer.lastBookingDate)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(customer.totalAmountSpent)}</td>
                  <td className={cn("px-4 py-3", customer.outstandingAmount > 0 && "text-warning font-medium")}>
                    {formatCurrency(customer.outstandingAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(customer.status)}>
                      {formatCustomerStatus(customer.status)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      </div>

      <div className="space-y-3 lg:hidden">
        {customers.map((customer) => (
          <button
            key={customer.customerKey}
            type="button"
            className="border-border/70 bg-card w-full rounded-[var(--radius-lg)] border p-4 text-left"
            onClick={() => onSelect(customer)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{customer.name}</p>
                <p className="text-muted-foreground mt-1 text-sm">{customer.phone}</p>
                {customer.email ? (
                  <p className="text-muted-foreground text-sm">{customer.email}</p>
                ) : null}
              </div>
              <Badge variant={statusVariant(customer.status)}>
                {formatCustomerStatus(customer.status)}
              </Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Bookings</p>
                <p className="font-medium">{customer.totalBookings}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Spent</p>
                <p className="font-medium">{formatCurrency(customer.totalAmountSpent)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Last booking</p>
                <p className="font-medium">
                  {customer.lastBookingDate
                    ? formatBookingDateLabel(customer.lastBookingDate)
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Outstanding</p>
                <p className={cn("font-medium", customer.outstandingAmount > 0 && "text-warning")}>
                  {formatCurrency(customer.outstandingAmount)}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
