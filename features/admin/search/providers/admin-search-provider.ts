import {
  ADMIN_PAGE_SEARCH_ITEMS,
  ADMIN_PLACEHOLDER_SEARCH_ITEMS,
  ADMIN_SEARCH_ITEMS,
} from "@/features/admin/search/config/admin-search-items";
import type {
  AdminSearchProvider,
  AdminSearchResult,
} from "@/features/admin/search/types/admin-search.types";

function normalizeQuery(query: string) {
  return query.trim().toLowerCase();
}

function matchesQuery(item: AdminSearchResult, query: string) {
  if (!query) return true;

  const haystack = [
    item.label,
    item.description ?? "",
    ...(item.keywords ?? []),
    item.scope,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

export function filterAdminSearchResults(
  items: AdminSearchResult[],
  query: string,
): AdminSearchResult[] {
  const normalized = normalizeQuery(query);
  return items.filter((item) => matchesQuery(item, normalized));
}

function createStaticProvider(
  id: string,
  label: string,
  scope: AdminSearchResult["scope"],
  items: AdminSearchResult[],
): AdminSearchProvider {
  return {
    id,
    label,
    scope,
    search: (query) => filterAdminSearchResults(items, query),
  };
}

export const ADMIN_SEARCH_PROVIDERS: AdminSearchProvider[] = [
  createStaticProvider("pages", "Admin Pages", "pages", ADMIN_PAGE_SEARCH_ITEMS),
  createStaticProvider("bookings", "Bookings", "bookings", ADMIN_PLACEHOLDER_SEARCH_ITEMS.filter((item) => item.scope === "bookings")),
  createStaticProvider("customers", "Customers", "customers", ADMIN_PLACEHOLDER_SEARCH_ITEMS.filter((item) => item.scope === "customers")),
  createStaticProvider("pricing", "Pricing", "pricing", ADMIN_PLACEHOLDER_SEARCH_ITEMS.filter((item) => item.scope === "pricing")),
  createStaticProvider("reports", "Reports", "reports", ADMIN_PLACEHOLDER_SEARCH_ITEMS.filter((item) => item.scope === "reports")),
  createStaticProvider("gallery", "Gallery", "gallery", ADMIN_PLACEHOLDER_SEARCH_ITEMS.filter((item) => item.scope === "gallery")),
  createStaticProvider("events", "Events", "events", ADMIN_PLACEHOLDER_SEARCH_ITEMS.filter((item) => item.scope === "events")),
  createStaticProvider("settings", "Settings", "settings", ADMIN_PLACEHOLDER_SEARCH_ITEMS.filter((item) => item.scope === "settings")),
];

export function searchAdminGlobal(query: string): AdminSearchResult[] {
  const normalized = normalizeQuery(query);

  if (!normalized) {
    return ADMIN_SEARCH_ITEMS;
  }

  const providerResults = ADMIN_SEARCH_PROVIDERS.flatMap((provider) => provider.search(normalized));
  const seen = new Set<string>();

  return providerResults.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function groupAdminSearchResults(results: AdminSearchResult[]) {
  const groups = new Map<string, AdminSearchResult[]>();

  for (const result of results) {
    const current = groups.get(result.scope) ?? [];
    current.push(result);
    groups.set(result.scope, current);
  }

  return Array.from(groups.entries()).map(([scope, items]) => ({
    scope,
    items,
  }));
}
