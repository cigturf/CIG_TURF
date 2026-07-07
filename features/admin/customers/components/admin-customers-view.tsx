"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { CustomerProfileDrawer } from "@/features/admin/customers/components/customer-profile-drawer";
import { CustomersTable } from "@/features/admin/customers/components/customers-table";
import type {
  CustomerDirectoryData,
  CustomerFilter,
  CustomerListItem,
} from "@/features/admin/customers/types/customer.types";
import { useAdminShell } from "@/features/admin/providers/admin-shell-provider";
import { Button, Heading, Input, Text } from "@/components/design-system";
import { cn } from "@/lib/utils";

const FILTERS: { id: CustomerFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "repeat", label: "Repeat Customers" },
  { id: "new", label: "New Customers" },
  { id: "pending", label: "Pending Payment" },
  { id: "most_active", label: "Most Active" },
];

type AdminCustomersViewProps = {
  data: CustomerDirectoryData;
  onQueryChange: (input: { search?: string; filter?: CustomerFilter }) => Promise<void>;
  onRefresh: () => Promise<void>;
  isRefreshing?: boolean;
};

export function AdminCustomersView({
  data,
  onQueryChange,
  onRefresh,
  isRefreshing,
}: AdminCustomersViewProps) {
  const { admin } = useAdminShell();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CustomerFilter>("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isFirstQuery = useRef(true);

  useEffect(() => {
    if (isFirstQuery.current) {
      isFirstQuery.current = false;
      return;
    }
    const timeout = window.setTimeout(() => {
      void onQueryChange({ search, filter });
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [search, filter, onQueryChange]);

  const handleSelect = useCallback((customer: CustomerListItem) => {
    setSelectedKey(customer.customerKey);
    setDrawerOpen(true);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <Heading level="h3" className="mb-1">
          Customer Directory
        </Heading>
        <Text className="text-muted-foreground">
          {data.total} customers · searchable booking history
          {isRefreshing ? " · Updating…" : ""}
        </Text>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, phone, email, or booking reference"
          className="max-w-xl"
        />
        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={filter === item.id ? "default" : "outline"}
              className={cn("shrink-0")}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <CustomersTable customers={data.customers} onSelect={handleSelect} />

      <CustomerProfileDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        customerKey={selectedKey}
        isOwner={admin.role === "owner"}
        onNotesSaved={onRefresh}
        onBookingCreated={onRefresh}
      />
    </div>
  );
}
