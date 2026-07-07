export type PricingRuleType = "default" | "range" | "override";

export type PricingBand = {
  startMinute: number;
  endMinute: number;
  price: number;
};

export type PricingRule = {
  id: string;
  groupId: string;
  version: number;
  type: PricingRuleType;
  price: number;
  name: string | null;
  bands: PricingBand[];
  startMinute: number | null;
  endMinute: number | null;
  dateStart: string | null; // YYYY-MM-DD
  dateEnd: string | null; // YYYY-MM-DD, null = no end (forever)
  weekdays: number[]; // legacy range rules only
  priority: number;
  active: boolean;
  archivedAt: Date | null;
  createdBy: string | null;
  createdAt: Date;
};

export type PricingOverrideInput = {
  name: string;
  dateStart: string;
  dateEnd?: string | null;
  bands: PricingBand[];
};

/** @deprecated Legacy single-band preview input */
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

export type PricingOverrideRule = {
  id: string;
  name: string;
  dateStart: string;
  dateEnd: string | null;
  bands: PricingBand[];
  active: boolean;
  createdAt: Date;
};

export type PricingSnapshot = {
  defaultPrice: number;
  overrides: PricingOverrideRule[];
};
