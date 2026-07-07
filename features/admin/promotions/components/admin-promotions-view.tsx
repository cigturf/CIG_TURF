"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AnalyticsCard,
  Badge,
  Button,
  Heading,
  Input,
  Text,
  Textarea,
} from "@/components/design-system";
import type { MediaAssetRecord } from "@/features/media/types";
import {
  PROMOTION_CONTENT_TYPE_LABELS,
  PROMOTION_DISPLAY_LOCATION_LABELS,
  PROMOTION_STATUS_LABELS,
  type PromotionContentType,
  type PromotionDisplayLocation,
  type PromotionInput,
  type PromotionRecord,
  type PromotionStatus,
} from "@/features/promotions/types";
import { resolveEffectiveStatus } from "@/features/promotions/services/promotion.service";
import { cn } from "@/lib/utils";

const CONTENT_TYPES = Object.keys(PROMOTION_CONTENT_TYPE_LABELS) as PromotionContentType[];
const DISPLAY_LOCATIONS = Object.keys(
  PROMOTION_DISPLAY_LOCATION_LABELS,
) as PromotionDisplayLocation[];
const STATUSES = Object.keys(PROMOTION_STATUS_LABELS) as PromotionStatus[];

function createEmptyPromotion(): PromotionInput {
  return {
    title: "",
    shortDescription: null,
    fullDescription: null,
    contentType: "general_promotion",
    status: "draft",
    bannerMediaId: null,
    galleryMediaIds: [],
    ctaText: null,
    ctaLink: null,
    startAt: null,
    endAt: null,
    priority: 0,
    displayLocations: [],
    venue: null,
    organizer: null,
    contactNumber: null,
    registrationLink: null,
    maxParticipants: null,
    entryFee: null,
    announcementEnabled: false,
  };
}

function toDatetimeLocal(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocal(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function AdminPromotionsView() {
  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAssetRecord[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PromotionStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<PromotionContentType | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PromotionInput>(createEmptyPromotion());
  const [isNew, setIsNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  const refresh = useCallback(async () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (typeFilter !== "all") params.set("contentType", typeFilter);

    const [promoRes, mediaRes] = await Promise.all([
      fetch(`/api/admin/promotions?${params.toString()}`, { cache: "no-store" }),
      fetch("/api/admin/media?visibility=public", { cache: "no-store" }),
    ]);

    if (promoRes.ok) {
      const data = (await promoRes.json()) as { promotions: PromotionRecord[] };
      setPromotions(data.promotions);
    }
    if (mediaRes.ok) {
      const data = (await mediaRes.json()) as { assets: MediaAssetRecord[] };
      setMediaAssets(data.assets);
    }
  }, [search, statusFilter, typeFilter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selected = useMemo(
    () => promotions.find((p) => p.id === selectedId) ?? null,
    [promotions, selectedId],
  );

  const effectiveStatus = useMemo(
    () => resolveEffectiveStatus(draft),
    [draft],
  );

  const openNew = () => {
    setIsNew(true);
    setSelectedId(null);
    setDraft(createEmptyPromotion());
  };

  const openEdit = (record: PromotionRecord) => {
    setIsNew(false);
    setSelectedId(record.id);
    setDraft({
      title: record.title,
      shortDescription: record.shortDescription,
      fullDescription: record.fullDescription,
      contentType: record.contentType,
      status: record.status,
      bannerMediaId: record.bannerMediaId,
      galleryMediaIds: record.galleryMediaIds,
      ctaText: record.ctaText,
      ctaLink: record.ctaLink,
      startAt: record.startAt,
      endAt: record.endAt,
      priority: record.priority,
      displayLocations: record.displayLocations,
      venue: record.venue,
      organizer: record.organizer,
      contactNumber: record.contactNumber,
      registrationLink: record.registrationLink,
      maxParticipants: record.maxParticipants,
      entryFee: record.entryFee,
      announcementEnabled: record.announcementEnabled,
    });
  };

  const save = async () => {
    if (!draft.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/promotions", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isNew ? { promotion: draft } : { id: selectedId, promotion: draft },
        ),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to save");
      toast.success(isNew ? "Content created" : "Content saved");
      setIsNew(false);
      setSelectedId(body.promotion.id);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const archive = async () => {
    if (!selectedId) return;
    try {
      const res = await fetch(`/api/admin/promotions?id=${selectedId}`, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to archive");
      toast.success("Content archived");
      setSelectedId(null);
      setIsNew(false);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to archive");
    }
  };

  const toggleLocation = (location: PromotionDisplayLocation) => {
    setDraft((cur) => ({
      ...cur,
      displayLocations: cur.displayLocations.includes(location)
        ? cur.displayLocations.filter((l) => l !== location)
        : [...cur.displayLocations, location],
    }));
  };

  const showEventFields = ["tournament", "coaching_camp", "practice_session"].includes(
    draft.contentType,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Heading level="h1">Promotions & Website Content</Heading>
          <Text className="text-muted-foreground mt-1">
            Create tournaments, offers, announcements and banners. Media is selected from the Media Library.
          </Text>
        </div>
        <Button onClick={openNew}>New Content</Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
        <aside className="space-y-4">
          <AnalyticsCard title="Filters" description="Search and filter content.">
            <div className="space-y-3">
              <Input
                placeholder="Search title…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as PromotionStatus | "all")}
                className="border-input bg-background h-10 w-full rounded-[var(--radius-md)] border px-3 text-sm"
              >
                <option value="all">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {PROMOTION_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as PromotionContentType | "all")}
                className="border-input bg-background h-10 w-full rounded-[var(--radius-md)] border px-3 text-sm"
              >
                <option value="all">All types</option>
                {CONTENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {PROMOTION_CONTENT_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
              <Button variant="secondary" onClick={() => void refresh()}>
                Apply
              </Button>
            </div>
          </AnalyticsCard>

          <AnalyticsCard title="Content List" description={`${promotions.length} items`}>
            <div className="max-h-[60vh] space-y-2 overflow-y-auto">
              {promotions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openEdit(item)}
                  className={cn(
                    "w-full rounded-[var(--radius-md)] border px-3 py-2 text-left text-sm transition-colors",
                    selectedId === item.id
                      ? "border-primary bg-primary/10"
                      : "border-border/70 hover:bg-muted/20",
                  )}
                >
                  <div className="font-medium">{item.title}</div>
                  <div className="text-muted-foreground mt-1 flex flex-wrap gap-1">
                    <Badge variant="outline">{PROMOTION_CONTENT_TYPE_LABELS[item.contentType]}</Badge>
                    <Badge variant="secondary">
                      {PROMOTION_STATUS_LABELS[resolveEffectiveStatus(item)]}
                    </Badge>
                  </div>
                </button>
              ))}
              {promotions.length === 0 ? (
                <Text size="sm" className="text-muted-foreground">
                  No content yet.
                </Text>
              ) : null}
            </div>
          </AnalyticsCard>
        </aside>

        <main>
          <AnalyticsCard
            title={isNew ? "Create Content" : selected ? "Edit Content" : "Editor"}
            description="Configure fields, schedule, and display locations."
          >
            {!isNew && !selected ? (
              <Text size="sm" className="text-muted-foreground">
                Select content from the list or create new.
              </Text>
            ) : (
              <div className="space-y-4">
                <Field label="Title" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} />
                <Field
                  label="Short Description"
                  value={draft.shortDescription ?? ""}
                  multiline
                  onChange={(v) => setDraft({ ...draft, shortDescription: v || null })}
                />
                <Field
                  label="Full Description"
                  value={draft.fullDescription ?? ""}
                  multiline
                  onChange={(v) => setDraft({ ...draft, fullDescription: v || null })}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField
                    label="Content Type"
                    value={draft.contentType}
                    options={CONTENT_TYPES.map((t) => ({
                      value: t,
                      label: PROMOTION_CONTENT_TYPE_LABELS[t],
                    }))}
                    onChange={(v) => setDraft({ ...draft, contentType: v as PromotionContentType })}
                  />
                  <SelectField
                    label="Status"
                    value={draft.status}
                    options={STATUSES.map((s) => ({
                      value: s,
                      label: PROMOTION_STATUS_LABELS[s],
                    }))}
                    onChange={(v) => setDraft({ ...draft, status: v as PromotionStatus })}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Start"
                    type="datetime-local"
                    value={toDatetimeLocal(draft.startAt)}
                    onChange={(v) => setDraft({ ...draft, startAt: fromDatetimeLocal(v) })}
                  />
                  <Field
                    label="End"
                    type="datetime-local"
                    value={toDatetimeLocal(draft.endAt)}
                    onChange={(v) => setDraft({ ...draft, endAt: fromDatetimeLocal(v) })}
                  />
                </div>

                <Field
                  label="Priority (higher shows first)"
                  type="number"
                  value={String(draft.priority)}
                  onChange={(v) => setDraft({ ...draft, priority: Number(v) || 0 })}
                />

                <div>
                  <Text size="sm" className="text-muted-foreground mb-2">
                    Display Locations
                  </Text>
                  <div className="flex flex-wrap gap-2">
                    {DISPLAY_LOCATIONS.map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => toggleLocation(loc)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs transition-colors",
                          draft.displayLocations.includes(loc)
                            ? "border-primary bg-primary/10"
                            : "border-border/70",
                        )}
                      >
                        {PROMOTION_DISPLAY_LOCATION_LABELS[loc]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Text size="sm" className="text-muted-foreground mb-2">
                    Banner Image (from Media Library)
                  </Text>
                  <select
                    value={draft.bannerMediaId ?? ""}
                    onChange={(e) =>
                      setDraft({ ...draft, bannerMediaId: e.target.value || null })
                    }
                    className="border-input bg-background h-10 w-full rounded-[var(--radius-md)] border px-3 text-sm"
                  >
                    <option value="">None</option>
                    {mediaAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.filename}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="CTA Text"
                    value={draft.ctaText ?? ""}
                    onChange={(v) => setDraft({ ...draft, ctaText: v || null })}
                  />
                  <Field
                    label="CTA Link"
                    value={draft.ctaLink ?? ""}
                    onChange={(v) => setDraft({ ...draft, ctaLink: v || null })}
                  />
                </div>

                {showEventFields ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Venue" value={draft.venue ?? ""} onChange={(v) => setDraft({ ...draft, venue: v || null })} />
                    <Field label="Organizer" value={draft.organizer ?? ""} onChange={(v) => setDraft({ ...draft, organizer: v || null })} />
                    <Field label="Contact Number" value={draft.contactNumber ?? ""} onChange={(v) => setDraft({ ...draft, contactNumber: v || null })} />
                    <Field label="Registration Link" value={draft.registrationLink ?? ""} onChange={(v) => setDraft({ ...draft, registrationLink: v || null })} />
                    <Field label="Max Participants" type="number" value={String(draft.maxParticipants ?? "")} onChange={(v) => setDraft({ ...draft, maxParticipants: v ? Number(v) : null })} />
                    <Field label="Entry Fee (₹)" type="number" value={String(draft.entryFee ?? "")} onChange={(v) => setDraft({ ...draft, entryFee: v ? Number(v) : null })} />
                  </div>
                ) : null}

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.announcementEnabled}
                    onChange={(e) =>
                      setDraft({ ...draft, announcementEnabled: e.target.checked })
                    }
                  />
                  Enable announcement bar for this content
                </label>

                <div className="flex flex-wrap gap-2">
                  <Button loading={isSaving} onClick={() => void save()}>
                    Save
                  </Button>
                  {!isNew && selectedId ? (
                    <Button variant="destructive" onClick={() => void archive()}>
                      Archive
                    </Button>
                  ) : null}
                </div>
              </div>
            )}
          </AnalyticsCard>
        </main>

        <aside>
          <AnalyticsCard title="Live Preview" description="Preview before publishing.">
            <div className="mb-3 flex gap-2">
              <Button
                size="sm"
                variant={previewMode === "desktop" ? "default" : "secondary"}
                onClick={() => setPreviewMode("desktop")}
              >
                Desktop
              </Button>
              <Button
                size="sm"
                variant={previewMode === "mobile" ? "default" : "secondary"}
                onClick={() => setPreviewMode("mobile")}
              >
                Mobile
              </Button>
            </div>
            <div
              className={cn(
                "border-border/70 overflow-hidden rounded-[var(--radius-lg)] border",
                previewMode === "mobile" ? "mx-auto max-w-[320px]" : "w-full",
              )}
            >
              {draft.bannerMediaId ? (
                <div className="bg-muted/20 relative aspect-[16/9] w-full">
                  <Image
                    src={`/api/media/${draft.bannerMediaId}`}
                    alt={draft.title}
                    fill
                    sizes="360px"
                    className="object-cover"
                  />
                </div>
              ) : null}
              <div className="space-y-2 p-4">
                <Badge variant="outline">{PROMOTION_CONTENT_TYPE_LABELS[draft.contentType]}</Badge>
                <Badge variant="secondary">{PROMOTION_STATUS_LABELS[effectiveStatus]}</Badge>
                <Text className="font-semibold">{draft.title || "Untitled"}</Text>
                {draft.shortDescription ? (
                  <Text size="sm" className="text-muted-foreground">
                    {draft.shortDescription}
                  </Text>
                ) : null}
                {draft.ctaText ? (
                  <Button size="sm" variant="booking">
                    {draft.ctaText}
                  </Button>
                ) : null}
              </div>
            </div>
          </AnalyticsCard>
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <Text size="sm" className="text-muted-foreground">
        {label}
      </Text>
      {multiline ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} className="mt-1" />
      ) : (
        <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1" />
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Text size="sm" className="text-muted-foreground">
        {label}
      </Text>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-input bg-background mt-1 h-10 w-full rounded-[var(--radius-md)] border px-3 text-sm"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
