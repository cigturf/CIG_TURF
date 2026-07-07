import { ADMIN_NAV_ITEMS, ADMIN_ROUTES } from "@/features/admin/config/admin-navigation";
import type { AdminSearchResult } from "@/features/admin/search/types/admin-search.types";

export const ADMIN_PAGE_SEARCH_ITEMS: AdminSearchResult[] = ADMIN_NAV_ITEMS.map((item) => ({
  id: `page-${item.id}`,
  scope: "pages" as const,
  label: item.label,
  description: "Admin page",
  href: item.href,
  keywords: [item.label.toLowerCase(), item.id, item.href.replace("/admin/", "")],
}));

export const ADMIN_PLACEHOLDER_SEARCH_ITEMS: AdminSearchResult[] = [
  {
    id: "search-bookings",
    scope: "bookings",
    label: "Search bookings",
    description: "Find bookings by reference, customer, or date",
    href: ADMIN_ROUTES.bookings,
    keywords: ["booking", "reference", "customer", "cig"],
    placeholder: true,
  },
  {
    id: "search-customers",
    scope: "customers",
    label: "Search customers",
    description: "Find customers by name, phone, or email",
    href: ADMIN_ROUTES.bookings,
    keywords: ["customer", "phone", "email", "profile"],
    placeholder: true,
  },
  {
    id: "search-pricing",
    scope: "pricing",
    label: "Search pricing rules",
    description: "Peak hours, holidays, and slot rates",
    href: ADMIN_ROUTES.pricing,
    keywords: ["pricing", "rates", "peak", "holiday"],
    placeholder: true,
  },
  {
    id: "search-reports",
    scope: "reports",
    label: "Search reports",
    description: "Revenue, occupancy, and operational summaries",
    href: ADMIN_ROUTES.reports,
    keywords: ["reports", "analytics", "revenue"],
    placeholder: true,
  },
  {
    id: "search-gallery",
    scope: "gallery",
    label: "Search gallery",
    description: "Photos and media assets",
    href: ADMIN_ROUTES.gallery,
    keywords: ["gallery", "photos", "media"],
    placeholder: true,
  },
  {
    id: "search-events",
    scope: "events",
    label: "Search events",
    description: "Tournaments, camps, and promotions",
    href: ADMIN_ROUTES.events,
    keywords: ["events", "tournament", "camp"],
    placeholder: true,
  },
  {
    id: "search-settings",
    scope: "settings",
    label: "Search business settings",
    description: "Branding, contact, and operations",
    href: ADMIN_ROUTES.settings,
    keywords: ["settings", "business", "branding"],
    placeholder: true,
  },
];

export const ADMIN_SEARCH_ITEMS: AdminSearchResult[] = [
  ...ADMIN_PAGE_SEARCH_ITEMS,
  ...ADMIN_PLACEHOLDER_SEARCH_ITEMS,
];

export const ADMIN_SEARCH_SCOPE_LABELS: Record<AdminSearchResult["scope"], string> = {
  pages: "Pages",
  bookings: "Bookings",
  customers: "Customers",
  pricing: "Pricing",
  reports: "Reports",
  gallery: "Gallery",
  events: "Events",
  settings: "Settings",
};
