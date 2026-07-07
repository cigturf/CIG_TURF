export type AdminSearchScope =
  | "pages"
  | "bookings"
  | "customers"
  | "pricing"
  | "reports"
  | "gallery"
  | "events"
  | "settings";

export type AdminSearchResult = {
  id: string;
  scope: AdminSearchScope;
  label: string;
  description?: string;
  href: string;
  keywords?: string[];
  placeholder?: boolean;
};

export type AdminSearchProvider = {
  id: string;
  label: string;
  scope: AdminSearchScope;
  search: (query: string) => AdminSearchResult[];
};
