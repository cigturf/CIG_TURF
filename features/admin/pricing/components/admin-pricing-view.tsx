"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useRealtimePricing } from "@/features/pricing/hooks/use-realtime-pricing";
import type { PricingPreviewInput, PricingRule } from "@/features/pricing/types/pricing.types";
import {
  previewPricingSnapshot,
  resolveSlotPrice,
  validatePricingRule,
} from "@/features/pricing/services/pricing-engine.service";
import { resolveBookingEngineConfig } from "@/features/booking/services";
import { generateSlots } from "@/features/booking/services/slot-generator.service";
import { getTodayIso } from "@/features/booking/utils/time";
import { AnalyticsCard, Badge, Button, Heading, Input, Text } from "@/components/design-system";
import { useConfigContext } from "@/components/providers/config-provider";
import { formatCurrency } from "@/utils";

function toHHMM(minutes: number): string {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function minutesFromHHMM(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function weekdayLabels() {
  return [
    ["0", "Sun"],
    ["1", "Mon"],
    ["2", "Tue"],
    ["3", "Wed"],
    ["4", "Thu"],
    ["5", "Fri"],
    ["6", "Sat"],
  ] as const;
}

export function AdminPricingView() {
  const { publicSettings } = useConfigContext();
  const bookingConfig = useMemo(() => resolveBookingEngineConfig(publicSettings), [publicSettings]);

  const { rules, snapshot, hydrated } = useRealtimePricing();

  const today = getTodayIso();
  const [previewDate, setPreviewDate] = useState(today);

  const defaultRule = useMemo(() => rules.find((rule) => rule.type === "default" && rule.active) ?? null, [rules]);
  const activeRules = useMemo(() => rules.filter((rule) => rule.type !== "default" && rule.active), [rules]);

  const [defaultPriceDraft, setDefaultPriceDraft] = useState<number | null>(null);
  const liveDefaultPrice = defaultRule?.price ?? snapshot.defaultPrice;
  const defaultPriceInput = defaultPriceDraft ?? liveDefaultPrice;

  const [draft, setDraft] = useState<PricingPreviewInput>({
    type: "range",
    price: 900,
    startMinute: minutesFromHHMM("06:00"),
    endMinute: minutesFromHHMM("09:00"),
    dateStart: null,
    dateEnd: null,
    weekdays: [],
    priority: 10,
  });

  const previewSnapshot = useMemo(() => previewPricingSnapshot(rules, draft), [rules, draft]);

  const previewSlots = useMemo(() => {
    return generateSlots({
      dateIso: previewDate,
      config: bookingConfig,
      now: new Date(),
      selectedSlotIds: [],
      bookedSlotIds: new Set<string>(),
      blockedSlotIds: new Set<string>(),
      maintenanceSlotIds: new Set<string>(),
      isHoliday: false,
      pricing: previewSnapshot,
    });
  }, [previewDate, bookingConfig, previewSnapshot]);

  const saveDefaultPrice = async () => {
    if (!defaultPriceInput || defaultPriceInput <= 0) {
      toast.error("Default price must be greater than zero.");
      return;
    }

    const response = await fetch("/api/admin/pricing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price: defaultPriceInput }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      toast.error(body.error ?? "Failed to update default price");
      return;
    }

    setDefaultPriceDraft(null);
    toast.success("Default price updated");
  };

  const saveRule = async () => {
    const validation = validatePricingRule(draft);
    if (!validation.ok) {
      toast.error(validation.error);
      return;
    }
    const response = await fetch("/api/admin/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, type: "range" as const }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      toast.error(body.error ?? "Failed to create rule");
      return;
    }
    toast.success("Pricing rule created");
  };

  const deactivateRule = async (id: string) => {
    const response = await fetch("/api/admin/pricing", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      toast.error(body.error ?? "Failed to deactivate rule");
      return;
    }
    toast.success("Rule deactivated");
  };

  const priceBand = useMemo(() => {
    const prices = previewSlots.map((slot) => slot.price);
    if (prices.length === 0) return { min: 0, max: 0 };
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [previewSlots]);

  return (
    <div className="space-y-6">
      <div>
        <Heading level="h1">Pricing</Heading>
        <Text className="text-muted-foreground mt-1">
          Smart pricing engine — every slot price is resolved deterministically from active rules.
        </Text>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <AnalyticsCard title="Pricing Rules" description="Default price applies to every slot unless an override rule matches.">
          {!hydrated ? (
            <Text size="sm" className="text-muted-foreground">
              Loading rules…
            </Text>
          ) : (
            <div className="space-y-4">
              <div className="border-border/70 rounded-[var(--radius-md)] border p-3">
                <Text size="sm" className="text-muted-foreground">
                  Default slot price (live)
                </Text>
                <Text size="sm" className="text-muted-foreground mt-1">
                  Used for all slots when no override rule matches.
                </Text>
                <div className="mt-3 flex items-end gap-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      min={1}
                      value={String(defaultPriceInput)}
                      onChange={(event) => setDefaultPriceDraft(Number(event.target.value))}
                    />
                  </div>
                  <Button onClick={() => void saveDefaultPrice()}>Save</Button>
                </div>
                <Text size="sm" className="text-muted-foreground mt-2">
                  Current live default: {formatCurrency(liveDefaultPrice)}
                </Text>
              </div>

              <div className="space-y-2">
                <Text className="font-medium">Active override rules</Text>
                {activeRules.length === 0 ? (
                  <Text size="sm" className="text-muted-foreground">
                    No override rules yet.
                  </Text>
                ) : (
                  activeRules.map((rule) => (
                    <RuleRow key={rule.id} rule={rule} onDeactivate={() => void deactivateRule(rule.id)} />
                  ))
                )}
              </div>
            </div>
          )}
        </AnalyticsCard>

        <div className="space-y-6">
          <AnalyticsCard
            title="Override Rule"
            description="Create a range rule to change prices for specific times, dates, or weekdays."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Text size="sm" className="text-muted-foreground">
                      Override price
                    </Text>
                    <Input
                      type="number"
                      value={String(draft.price)}
                      onChange={(event) => setDraft((c) => ({ ...c, price: Number(event.target.value) }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Text size="sm" className="text-muted-foreground">
                      Priority
                    </Text>
                    <Input
                      type="number"
                      value={String(draft.priority ?? 0)}
                      onChange={(event) =>
                        setDraft((c) => ({ ...c, priority: Number(event.target.value) }))
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Text size="sm" className="text-muted-foreground">
                        Start time
                      </Text>
                      <Input
                        type="time"
                        value={toHHMM(draft.startMinute ?? 0)}
                        onChange={(event) =>
                          setDraft((c) => ({ ...c, startMinute: minutesFromHHMM(event.target.value) }))
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Text size="sm" className="text-muted-foreground">
                        End time
                      </Text>
                      <Input
                        type="time"
                        value={toHHMM(draft.endMinute ?? 0)}
                        onChange={(event) =>
                          setDraft((c) => ({ ...c, endMinute: minutesFromHHMM(event.target.value) }))
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Text size="sm" className="text-muted-foreground">
                      Date start (optional)
                    </Text>
                    <Input
                      type="date"
                      value={draft.dateStart ?? ""}
                      onChange={(event) =>
                        setDraft((c) => ({ ...c, dateStart: event.target.value || null }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Text size="sm" className="text-muted-foreground">
                      Date end (optional)
                    </Text>
                    <Input
                      type="date"
                      value={draft.dateEnd ?? ""}
                      onChange={(event) => setDraft((c) => ({ ...c, dateEnd: event.target.value || null }))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Text size="sm" className="text-muted-foreground">
                    Weekdays (optional)
                  </Text>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {weekdayLabels().map(([id, label]) => {
                      const day = Number(id);
                      const active = (draft.weekdays ?? []).includes(day);
                      return (
                        <Button
                          key={id}
                          size="sm"
                          variant={active ? "default" : "outline"}
                          onClick={() =>
                            setDraft((c) => {
                              const current = c.weekdays ?? [];
                              return {
                                ...c,
                                weekdays: active ? current.filter((d) => d !== day) : [...current, day],
                              };
                            })
                          }
                        >
                          {label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-end">
                  <Button className="w-full" onClick={() => void saveRule()}>
                    Save Override Rule
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Text className="font-medium">Preview</Text>
                    <Text size="sm" className="text-muted-foreground">
                      {formatCurrency(priceBand.min)} – {formatCurrency(priceBand.max)}
                    </Text>
                  </div>
                  <Input
                    type="date"
                    value={previewDate}
                    onChange={(event) => setPreviewDate(event.target.value)}
                    className="h-9 w-[160px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {previewSlots.slice(0, 16).map((slot) => (
                    <div
                      key={slot.id}
                      className="border-border/70 rounded-[var(--radius-md)] border p-3"
                    >
                      <Text size="sm" className="font-medium">
                        {slot.timeLabel}
                      </Text>
                      <Text size="sm" className="text-muted-foreground mt-1">
                        {formatCurrency(slot.price)}
                      </Text>
                    </div>
                  ))}
                </div>

                <Text size="sm" className="text-muted-foreground">
                  Final slot price resolver is shared across customer booking, admin slots, and dashboard.
                </Text>
              </div>
            </div>
          </AnalyticsCard>

          <AnalyticsCard title="Effective Price" description="Deterministic rule priority (one final price per slot).">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Specific Date</Badge>
              <Text size="sm" className="text-muted-foreground">
                &gt;
              </Text>
              <Badge variant="secondary">Recurring Weekday</Badge>
              <Text size="sm" className="text-muted-foreground">
                &gt;
              </Text>
              <Badge variant="secondary">Default</Badge>
            </div>
            <Text size="sm" className="text-muted-foreground mt-3">
              Example: For {previewDate} at 06:00, resolved price is{" "}
              <span className="font-medium text-foreground">
                {formatCurrency(
                  resolveSlotPrice({
                    snapshot: previewSnapshot,
                    dateIso: previewDate,
                    startMinute: minutesFromHHMM("06:00"),
                  }),
                )}
              </span>
              .
            </Text>
          </AnalyticsCard>
        </div>
      </div>
    </div>
  );
}

function RuleRow({ rule, onDeactivate }: { rule: PricingRule; onDeactivate: () => void }) {
  const scope = (() => {
    const dates =
      rule.dateStart || rule.dateEnd
        ? `${rule.dateStart ?? "…"} → ${rule.dateEnd ?? "…"}`
        : "All dates";
    const days = rule.weekdays.length
      ? ` · ${rule.weekdays.map(String).join(",")}`
      : "";
    const time =
      rule.startMinute !== null && rule.endMinute !== null
        ? ` · ${toHHMM(rule.startMinute)}–${toHHMM(rule.endMinute)}`
        : "";
    return `${dates}${days}${time}`;
  })();

  return (
    <div className="border-border/70 rounded-[var(--radius-md)] border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Text size="sm" className="font-medium">
            {formatCurrency(rule.price)}
          </Text>
          <Text size="sm" className="text-muted-foreground mt-1">
            {scope}
          </Text>
          <Text size="sm" className="text-muted-foreground mt-1">
            Priority {rule.priority}
          </Text>
        </div>
        <Button size="sm" variant="outline" onClick={onDeactivate}>
          Deactivate
        </Button>
      </div>
    </div>
  );
}

