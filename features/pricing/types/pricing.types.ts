export type PricingRuleType = "default" | "range";

export type PricingRule = {
  id: string;
  groupId: string;
  version: number;
  type: PricingRuleType;
  price: number;
  startMinute: number | null;
  endMinute: number | null;
  dateStart: string | null; // YYYY-MM-DD
  dateEnd: string | null; // YYYY-MM-DD
  weekdays: number[]; // 0..6 (Sun..Sat), empty means "all"
  priority: number;
  active: boolean;
  archivedAt: Date | null;
  createdBy: string | null;
  createdAt: Date;
};

export type PricingPreviewInput = {
  type: PricingRuleType;
  price: number;
  startMinute?: number | null;
  endMinute?: number | null;
  dateStart?: string | null;
  dateEnd?: string | null;
  weekdays?: number[] | null;
  priority?: number;
};

export type PricingSnapshot = {
  defaultPrice: number;
  rules: PricingRule[];
};

