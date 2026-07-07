"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";

import { ADMIN_ROUTES } from "@/features/admin/config/admin-navigation";
import { ADMIN_SEARCH_SCOPE_LABELS } from "@/features/admin/search/config/admin-search-items";
import {
  groupAdminSearchResults,
  searchAdminGlobal,
} from "@/features/admin/search/providers/admin-search-provider";
import type { AdminSearchResult, AdminSearchScope } from "@/features/admin/search/types/admin-search.types";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Text,
} from "@/components/design-system";
import { cn } from "@/lib/utils";

async function searchBookings(query: string): Promise<AdminSearchResult[]> {
  if (query.trim().length < 2) return [];

  const response = await fetch(`/api/admin/bookings/search?q=${encodeURIComponent(query)}`, {
    cache: "no-store",
  });

  if (!response.ok) return [];

  const data = (await response.json()) as {
    bookings: Array<{
      id: string;
      bookingReference: string;
      customerName: string;
      bookingDate: string;
      startTime: string;
    }>;
  };

  return data.bookings.map((booking) => ({
    id: `booking-${booking.id}`,
    scope: "bookings" as const,
    label: booking.bookingReference,
    description: `${booking.customerName} · ${booking.bookingDate} · ${booking.startTime}`,
    href: `${ADMIN_ROUTES.bookings}?id=${booking.id}`,
    keywords: [booking.bookingReference, booking.customerName],
  }));
}

export function AdminCommandPalette() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [bookingResults, setBookingResults] = useState<AdminSearchResult[]>([]);

  const staticResults = useMemo(() => searchAdminGlobal(query), [query]);
  const results = useMemo(() => {
    const merged = [...bookingResults, ...staticResults];
    const seen = new Set<string>();
    return merged.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [bookingResults, staticResults]);

  const groupedResults = useMemo(() => groupAdminSearchResults(results), [results]);
  const flatResults = useMemo(
    () => groupedResults.flatMap((group) => group.items),
    [groupedResults],
  );

  const openPalette = useCallback(() => {
    setOpen(true);
    setQuery("");
    setActiveIndex(0);
    setBookingResults([]);
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
    setBookingResults([]);
  }, []);

  const navigateTo = useCallback(
    (item: AdminSearchResult) => {
      closePalette();
      router.push(item.href);
    },
    [closePalette, router],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openPalette();
        return;
      }

      if (event.key === "Escape" && open) {
        event.preventDefault();
        closePalette();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closePalette, open, openPalette]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setBookingResults([]);
      return;
    }

    const timeout = window.setTimeout(() => {
      void searchBookings(query).then(setBookingResults);
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [open, query]);

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, Math.max(flatResults.length - 1, 0)));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const item = flatResults[activeIndex];
      if (item) navigateTo(item);
    }
  };

  let runningIndex = -1;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-muted-foreground hidden h-9 gap-2 md:inline-flex"
        onClick={openPalette}
      >
        <Search className="size-4" />
        <span>Search</span>
        <kbd className="bg-muted ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        onClick={openPalette}
        aria-label="Open command palette"
      >
        <Search className="size-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
          <DialogHeader className="border-border/60 border-b px-4 py-4 text-left">
            <DialogTitle>Command palette</DialogTitle>
            <DialogDescription>
              Search bookings by reference, customer, phone, or email. Use arrow keys to navigate.
            </DialogDescription>
          </DialogHeader>

          <div className="border-border/60 border-b px-4 py-3">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Try CIG-20260712-0012 or customer name…"
                className="border-input bg-background focus-visible:ring-ring/40 h-11 w-full rounded-[var(--radius-md)] border pr-3 pl-10 text-sm outline-none focus-visible:ring-2"
              />
            </div>
          </div>

          <div className="max-h-[min(420px,50vh)] overflow-y-auto p-2">
            {flatResults.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <Text className="text-muted-foreground">No results found.</Text>
              </div>
            ) : (
              groupedResults.map((group) => (
                <div key={group.scope} className="mb-2 last:mb-0">
                  <Text
                    size="sm"
                    className="text-muted-foreground px-3 py-2 font-medium tracking-wide uppercase"
                  >
                    {ADMIN_SEARCH_SCOPE_LABELS[group.scope as AdminSearchScope]}
                  </Text>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      runningIndex += 1;
                      const itemIndex = runningIndex;
                      const isActive = itemIndex === activeIndex;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onMouseEnter={() => setActiveIndex(itemIndex)}
                          onClick={() => navigateTo(item)}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left transition-colors",
                            isActive ? "bg-muted" : "hover:bg-muted/60",
                          )}
                        >
                          <span className="min-w-0">
                            <span className="flex items-center gap-2">
                              <Text className="font-medium">{item.label}</Text>
                              {item.placeholder ? (
                                <Badge variant="outline">Soon</Badge>
                              ) : null}
                            </span>
                            {item.description ? (
                              <Text size="sm" className="text-muted-foreground mt-0.5 truncate">
                                {item.description}
                              </Text>
                            ) : null}
                          </span>
                          <ArrowRight className="text-muted-foreground size-4 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
