import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase/admin";

import { DEFAULT_SLOT_PRICE } from "@/features/pricing/config/pricing.defaults";
import type { PricingRule, PricingRuleType } from "@/features/pricing/types/pricing.types";

type PricingRuleRow = {
  id: string;
  group_id: string;
  version: number;
  type: PricingRuleType;
  price: number;
  start_minute: number | null;
  end_minute: number | null;
  date_start: string | null;
  date_end: string | null;
  weekdays: number[] | null;
  priority: number;
  active: boolean;
  archived_at: string | null;
  created_by: string | null;
  created_at: string;
};

function mapPricingRule(row: PricingRuleRow): PricingRule {
  return {
    id: row.id,
    groupId: row.group_id,
    version: row.version,
    type: row.type,
    price: row.price,
    startMinute: row.start_minute,
    endMinute: row.end_minute,
    dateStart: row.date_start,
    dateEnd: row.date_end,
    weekdays: row.weekdays ?? [],
    priority: row.priority,
    active: row.active,
    archivedAt: row.archived_at ? new Date(row.archived_at) : null,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
  };
}

async function fetchActivePricingRulesFromStore(): Promise<PricingRule[]> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("pricing_rules")
      .select("*")
      .eq("active", true)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });
    if (!error && data) return (data as PricingRuleRow[]).map(mapPricingRule);
  }

  try {
    const rows = await prisma.pricingRule.findMany({
      where: { active: true },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });
    return rows.map((row) => ({
      id: row.id,
      groupId: row.groupId,
      version: row.version,
      type: row.type as PricingRuleType,
      price: row.price,
      startMinute: row.startMinute ?? null,
      endMinute: row.endMinute ?? null,
      dateStart: row.dateStart ?? null,
      dateEnd: row.dateEnd ?? null,
      weekdays: row.weekdays ?? [],
      priority: row.priority,
      active: row.active,
      archivedAt: row.archivedAt ?? null,
      createdBy: row.createdBy ?? null,
      createdAt: row.createdAt,
    }));
  } catch {
    return [];
  }
}

/** Ensures one active default rule exists, then returns all active rules. */
export async function listActivePricingRules(): Promise<PricingRule[]> {
  let rules = await fetchActivePricingRulesFromStore();
  const hasDefault = rules.some((rule) => rule.type === "default" && rule.active);
  if (!hasDefault) {
    await createPricingRule({ type: "default", price: DEFAULT_SLOT_PRICE, priority: 0 });
    rules = await fetchActivePricingRulesFromStore();
  }
  return rules;
}

export async function deactivateActiveDefaultRules(): Promise<void> {
  const rules = await listAllPricingRules();
  const activeDefaults = rules.filter((rule) => rule.type === "default" && rule.active);
  await Promise.all(activeDefaults.map((rule) => deactivatePricingRule(rule.id)));
}

export async function upsertDefaultPricingRule(
  price: number,
  createdBy?: string | null,
): Promise<PricingRule> {
  await deactivateActiveDefaultRules();
  return createPricingRule({
    type: "default",
    price,
    priority: 0,
    createdBy,
  });
}

export async function listAllPricingRules(): Promise<PricingRule[]> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("pricing_rules")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) return (data as PricingRuleRow[]).map(mapPricingRule);
  }

  try {
    const rows = await prisma.pricingRule.findMany({
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => ({
      id: row.id,
      groupId: row.groupId,
      version: row.version,
      type: row.type as PricingRuleType,
      price: row.price,
      startMinute: row.startMinute ?? null,
      endMinute: row.endMinute ?? null,
      dateStart: row.dateStart ?? null,
      dateEnd: row.dateEnd ?? null,
      weekdays: row.weekdays ?? [],
      priority: row.priority,
      active: row.active,
      archivedAt: row.archivedAt ?? null,
      createdBy: row.createdBy ?? null,
      createdAt: row.createdAt,
    }));
  } catch {
    return [];
  }
}

export async function createPricingRule(data: {
  type: PricingRuleType;
  price: number;
  startMinute?: number | null;
  endMinute?: number | null;
  dateStart?: string | null;
  dateEnd?: string | null;
  weekdays?: number[] | null;
  priority?: number;
  createdBy?: string | null;
  groupId?: string;
  version?: number;
}): Promise<PricingRule> {
  const { randomUUID } = await import("crypto");
  const id = randomUUID();
  const now = new Date().toISOString();
  const groupId = data.groupId ?? randomUUID();
  const version = data.version ?? 1;

  const supabase = createServiceRoleClient();
  if (supabase) {
    const payload = {
      id,
      group_id: groupId,
      version,
      type: data.type,
      price: data.price,
      start_minute: data.startMinute ?? null,
      end_minute: data.endMinute ?? null,
      date_start: data.dateStart ?? null,
      date_end: data.dateEnd ?? null,
      weekdays: (data.weekdays ?? []) as number[],
      priority: data.priority ?? 0,
      active: true,
      archived_at: null,
      created_by: data.createdBy ?? null,
      created_at: now,
    };
    const { data: row, error } = await supabase.from("pricing_rules").insert(payload).select("*").single();
    if (!error && row) return mapPricingRule(row as PricingRuleRow);
    if (error) throw new Error(error.message);
  }

  const row = await prisma.pricingRule.create({
    data: {
      id,
      groupId,
      version,
      type: data.type,
      price: data.price,
      startMinute: data.startMinute ?? null,
      endMinute: data.endMinute ?? null,
      dateStart: data.dateStart ?? null,
      dateEnd: data.dateEnd ?? null,
      weekdays: data.weekdays ?? [],
      priority: data.priority ?? 0,
      active: true,
      archivedAt: null,
      createdBy: data.createdBy ?? null,
      createdAt: new Date(now),
    },
  });

  return {
    id: row.id,
    groupId: row.groupId,
    version: row.version,
    type: row.type as PricingRuleType,
    price: row.price,
    startMinute: row.startMinute ?? null,
    endMinute: row.endMinute ?? null,
    dateStart: row.dateStart ?? null,
    dateEnd: row.dateEnd ?? null,
    weekdays: row.weekdays ?? [],
    priority: row.priority,
    active: row.active,
    archivedAt: row.archivedAt ?? null,
    createdBy: row.createdBy ?? null,
    createdAt: row.createdAt,
  };
}

export async function deactivatePricingRule(ruleId: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  if (supabase) {
    await supabase
      .from("pricing_rules")
      .update({ active: false, archived_at: now })
      .eq("id", ruleId);
    return;
  }

  await prisma.pricingRule.update({
    where: { id: ruleId },
    data: { active: false, archivedAt: new Date(now) },
  });
}

