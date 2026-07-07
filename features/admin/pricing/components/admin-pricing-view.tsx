"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useAdminPricing } from "@/features/admin/pricing/hooks/use-admin-pricing";
import type { PricingBand, PricingOverrideInput } from "@/features/pricing/types/pricing.types";
import {
  getOverrideStatus,
  previewPricingSnapshot,
  resolveSlotPrice,
  ruleToOverride,
  validateOverrideRule,
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
  return (h ?? 0) * 60 + (m ?? 0);
}

function emptyBand(): PricingBand {
  return { startMinute: minutesFromHHMM("06:00"), endMinute: minutesFromHHMM("09:00"), price: 700 };
}

function createEmptyDraft(): PricingOverrideInput {
  return {
    name: "",
    dateStart: getTodayIso(),
    dateEnd: null,
    bands: [emptyBand()],
  };
}

export function AdminPricingView() {
  const { publicSettings } = useConfigContext();
  const bookingConfig = useMemo(() => resolveBookingEngineConfig(publicSettings), [publicSettings]);

  const { rules, snapshot, overrideRules, hydrated, isFetching, invalidate } = useAdminPricing();

  const today = getTodayIso();
  const [previewDate, setPreviewDate] = useState(today);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultRule = useMemo(() => rules.find((rule) => rule.type === "default" && rule.active) ?? null, [rules]);

  const [defaultPriceDraft, setDefaultPriceDraft] = useState<number | null>(null);
  const liveDefaultPrice = defaultRule?.price ?? snapshot.defaultPrice;
  const defaultPriceInput = defaultPriceDraft ?? liveDefaultPrice;

  const [draft, setDraft] = useState<PricingOverrideInput>(createEmptyDraft);

  const previewSnapshot = useMemo(() => {
    if (!showPreview) return snapshot;
    return previewPricingSnapshot(rules.filter((rule) => rule.active), draft);
  }, [showPreview, snapshot, rules, draft]);

  const previewSlots = useMemo(() => {
    if (!showPreview) return [];
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
  }, [showPreview, previewDate, bookingConfig, previewSnapshot]);

  const saveDefaultPrice = async () => {
    if (!defaultPriceInput || defaultPriceInput <= 0) {
      toast.error("Default price must be greater than zero.");
      return;
    }

    setIsSubmitting(true);
    try {
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
      invalidate();
      toast.success("Default price updated");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activateRule = async () => {
    const validation = validateOverrideRule(draft);
    if (!validation.ok) {
      toast.error(validation.error);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "override", ...draft }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        toast.error(body.error ?? "Failed to activate rule");
        return;
      }

      setDraft(createEmptyDraft());
      setShowPreview(false);
      invalidate();
      toast.success("Override rule activated — prices are live");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deactivateRule = async (id: string) => {
    setIsSubmitting(true);
    try {
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
      invalidate();
      toast.success("Rule deactivated");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateBand = (index: number, patch: Partial<PricingBand>) => {
    setDraft((current) => ({
      ...current,
      bands: current.bands.map((band, bandIndex) =>
        bandIndex === index ? { ...band, ...patch } : band,
      ),
    }));
  };

  const addBand = () => {
    setDraft((current) => ({
      ...current,
      bands: [...current.bands, emptyBand()],
    }));
  };

  const removeBand = (index: number) => {
    setDraft((current) => ({
      ...current,
      bands: current.bands.length <= 1 ? current.bands : current.bands.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <Heading level="h1">Pricing</Heading>
        <Text className="text-muted-foreground mt-1">
          Set a default slot price, then create named override rules with date ranges and time bands.
        </Text>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <AnalyticsCard title="Default price" description="Used when no override rule matches the selected date and time.">
          {!hydrated ? (
            <Text size="sm" className="text-muted-foreground">
              Loading…
            </Text>
          ) : (
            <div className="space-y-4">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Text size="sm" className="text-muted-foreground mb-1">
                    Price per slot (₹)
                  </Text>
                  <Input
                    type="number"
                    min={1}
                    value={String(defaultPriceInput)}
                    onChange={(event) => setDefaultPriceDraft(Number(event.target.value))}
                  />
                </div>
                <Button onClick={() => void saveDefaultPrice()} disabled={isSubmitting}>
                  Save
                </Button>
              </div>
              <Text size="sm" className="text-muted-foreground">
                Live default: {formatCurrency(liveDefaultPrice)}
              </Text>

              <div className="space-y-2 border-t border-border/70 pt-4">
                <Text className="font-medium">Override rules</Text>
                {overrideRules.length === 0 ? (
                  <Text size="sm" className="text-muted-foreground">
                    No override rules yet.
                  </Text>
                ) : (
                  overrideRules.map((rule) => (
                    <RuleRow
                      key={rule.id}
                      rule={rule}
                      todayIso={today}
                      onDeactivate={() => void deactivateRule(rule.id)}
                      disabled={isSubmitting}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </AnalyticsCard>

        <div className="space-y-6">
          <AnalyticsCard
            title="New override rule"
            description="Name the rule, set a date range, add one or more time slot bands, then activate."
          >
            <div className="space-y-4">
              <div>
                <Text size="sm" className="text-muted-foreground">
                  Rule name
                </Text>
                <Input
                  value={draft.name}
                  onChange={(event) => setDraft((c) => ({ ...c, name: event.target.value }))}
                  placeholder="e.g. Summer weekends"
                  className="mt-1"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Text size="sm" className="text-muted-foreground">
                    Start date
                  </Text>
                  <Input
                    type="date"
                    value={draft.dateStart}
                    onChange={(event) => setDraft((c) => ({ ...c, dateStart: event.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Text size="sm" className="text-muted-foreground">
                    End date (optional)
                  </Text>
                  <Input
                    type="date"
                    value={draft.dateEnd ?? ""}
                    onChange={(event) =>
                      setDraft((c) => ({ ...c, dateEnd: event.target.value || null }))
                    }
                    className="mt-1"
                  />
                  <Text size="sm" className="text-muted-foreground mt-1">
                    Leave empty to run forever
                  </Text>
                </div>
              </div>

              <div className="space-y-3">
                <Text className="font-medium">Time slot ranges</Text>
                {draft.bands.map((band, index) => (
                  <div
                    key={index}
                    className="border-border/70 grid gap-3 rounded-[var(--radius-md)] border p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
                  >
                    <div>
                      <Text size="sm" className="text-muted-foreground">
                        From
                      </Text>
                      <Input
                        type="time"
                        value={toHHMM(band.startMinute)}
                        onChange={(event) =>
                          updateBand(index, { startMinute: minutesFromHHMM(event.target.value) })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Text size="sm" className="text-muted-foreground">
                        To
                      </Text>
                      <Input
                        type="time"
                        value={toHHMM(band.endMinute)}
                        onChange={(event) =>
                          updateBand(index, { endMinute: minutesFromHHMM(event.target.value) })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Text size="sm" className="text-muted-foreground">
                        Price (₹)
                      </Text>
                      <Input
                        type="number"
                        min={1}
                        value={String(band.price)}
                        onChange={(event) => updateBand(index, { price: Number(event.target.value) })}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeBand(index)}
                        disabled={draft.bands.length <= 1}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={addBand}>
                  Add another range
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void activateRule()} disabled={isSubmitting || isFetching}>
                  Activate rule
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(true)}
                  disabled={isSubmitting}
                >
                  Preview on date
                </Button>
                {showPreview ? (
                  <Button variant="ghost" onClick={() => setShowPreview(false)}>
                    Hide preview
                  </Button>
                ) : null}
              </div>
            </div>
          </AnalyticsCard>

          {showPreview ? (
            <AnalyticsCard title="Preview" description="Slot prices with this draft rule applied on the selected date.">
              <div className="mb-4 flex items-center justify-between gap-3">
                <Text size="sm" className="text-muted-foreground">
                  When the rule expires, slots fall back to the default price.
                </Text>
                <Input
                  type="date"
                  value={previewDate}
                  onChange={(event) => setPreviewDate(event.target.value)}
                  className="h-9 w-[160px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {previewSlots.slice(0, 16).map((slot) => (
                  <div key={slot.id} className="border-border/70 rounded-[var(--radius-md)] border p-3">
                    <Text size="sm" className="font-medium">
                      {slot.timeLabel}
                    </Text>
                    <Text size="sm" className="text-muted-foreground mt-1">
                      {formatCurrency(slot.price)}
                    </Text>
                  </div>
                ))}
              </div>

              <Text size="sm" className="text-muted-foreground mt-3">
                Example at 06:00:{" "}
                <span className="font-medium text-foreground">
                  {formatCurrency(
                    resolveSlotPrice({
                      snapshot: previewSnapshot,
                      dateIso: previewDate,
                      startMinute: minutesFromHHMM("06:00"),
                    }),
                  )}
                </span>
              </Text>
            </AnalyticsCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function RuleRow({
  rule,
  todayIso,
  onDeactivate,
  disabled,
}: {
  rule: import("@/features/pricing/types/pricing.types").PricingRule;
  todayIso: string;
  onDeactivate: () => void;
  disabled: boolean;
}) {
  const override = ruleToOverride({ ...rule, active: true });
  const status = override
    ? getOverrideStatus({ ...override, active: rule.active }, todayIso)
    : "inactive";

  const statusBadge = {
    active: { label: "Live", variant: "default" as const },
    scheduled: { label: "Scheduled", variant: "secondary" as const },
    expired: { label: "Expired", variant: "outline" as const },
    inactive: { label: "Inactive", variant: "outline" as const },
  }[status];

  const dateLabel =
    rule.dateStart && rule.dateEnd
      ? `${rule.dateStart} → ${rule.dateEnd}`
      : rule.dateStart
        ? `${rule.dateStart} → forever`
        : "No dates";

  const bands =
    rule.bands.length > 0
      ? rule.bands
      : rule.startMinute !== null && rule.endMinute !== null
        ? [{ startMinute: rule.startMinute, endMinute: rule.endMinute, price: rule.price }]
        : [];

  return (
    <div className="border-border/70 rounded-[var(--radius-md)] border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Text size="sm" className="font-medium">
              {rule.name ?? "Override rule"}
            </Text>
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          </div>
          <Text size="sm" className="text-muted-foreground mt-1">
            {dateLabel}
          </Text>
          <div className="mt-2 space-y-1">
            {bands.map((band, index) => (
              <Text key={index} size="sm" className="text-muted-foreground">
                {toHHMM(band.startMinute)}–{toHHMM(band.endMinute)} · {formatCurrency(band.price)}
              </Text>
            ))}
          </div>
        </div>
        {rule.active ? (
          <Button size="sm" variant="outline" onClick={onDeactivate} disabled={disabled}>
            Deactivate
          </Button>
        ) : null}
      </div>
    </div>
  );
}
