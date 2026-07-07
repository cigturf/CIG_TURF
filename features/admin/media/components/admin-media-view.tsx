"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { AnalyticsCard, Badge, Button, Heading, Input, Text } from "@/components/design-system";
import type { MediaAssetRecord, MediaCategory, MediaVisibility } from "@/features/media/types";
import { cn } from "@/lib/utils";

const CATEGORIES: Array<{ id: MediaCategory | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "landing_hero", label: "Landing Hero" },
  { id: "gallery", label: "Gallery" },
  { id: "facilities", label: "Facilities" },
  { id: "tournament", label: "Tournament" },
  { id: "branding", label: "Branding" },
  { id: "logos", label: "Logos" },
  { id: "seo_images", label: "SEO Images" },
  { id: "promotional_banners", label: "Promotional Banners" },
  { id: "misc", label: "Misc" },
];

const VISIBILITY: Array<{ id: MediaVisibility | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "public", label: "Public" },
  { id: "private", label: "Private" },
  { id: "hidden", label: "Hidden" },
];

type UploadItem = {
  id: string;
  file: File;
  status: "queued" | "uploading" | "success" | "error";
  error?: string;
};

export function AdminMediaView() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [assets, setAssets] = useState<MediaAssetRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<MediaCategory | "all">("all");
  const [visibility, setVisibility] = useState<MediaVisibility | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (category !== "all") params.set("category", category);
      if (visibility !== "all") params.set("visibility", visibility);
      const res = await fetch(`/api/admin/media?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load media");
      const data = (await res.json()) as { assets: MediaAssetRecord[] };
      setAssets(data.assets);
      setHydrated(true);
      setSelectedId((current) =>
        current && !data.assets.some((a) => a.id === current) ? null : current,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load media");
    } finally {
      setIsRefreshing(false);
    }
  }, [search, category, visibility]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selected = useMemo(
    () => assets.find((a) => a.id === selectedId) ?? null,
    [assets, selectedId],
  );

  const onPickFiles = () => fileInputRef.current?.click();

  const enqueueFiles = (files: FileList | File[]) => {
    const items = Array.from(files).map<UploadItem>((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(16).slice(2)}`,
      file,
      status: "queued",
    }));
    setUploads((cur) => [...items, ...cur]);
    void uploadQueued(items);
  };

  const uploadQueued = async (items: UploadItem[]) => {
    for (const item of items) {
      setUploads((cur) => cur.map((u) => (u.id === item.id ? { ...u, status: "uploading" } : u)));
      try {
        const form = new FormData();
        form.set("file", item.file);
        form.set("category", category === "all" ? "misc" : category);
        form.set("visibility", visibility === "all" ? "public" : visibility);
        const res = await fetch("/api/admin/media", { method: "POST", body: form });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? "Upload failed");

        setUploads((cur) => cur.map((u) => (u.id === item.id ? { ...u, status: "success" } : u)));
        toast.success(`Uploaded ${item.file.name}`);
        await refresh();
      } catch (e) {
        const message = e instanceof Error ? e.message : "Upload failed";
        setUploads((cur) =>
          cur.map((u) => (u.id === item.id ? { ...u, status: "error", error: message } : u)),
        );
        toast.error(`${item.file.name}: ${message}`);
      }
    }
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files.length) enqueueFiles(files);
  };

  const updateSelected = async (patch: Partial<MediaAssetRecord>) => {
    if (!selected) return;
    try {
      const res = await fetch("/api/admin/media", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          patch: {
            category: patch.category ?? selected.category,
            visibility: patch.visibility ?? selected.visibility,
            altText: patch.altText ?? selected.altText,
            caption: patch.caption ?? selected.caption,
            sortOrder: patch.sortOrder ?? selected.sortOrder,
          },
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Update failed");
      await refresh();
      toast.success("Updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const softDeleteSelected = async () => {
    if (!selected) return;
    await updateSelected({ ...selected, deletedAt: new Date().toISOString() } as never);
  };

  const restoreSelected = async () => {
    if (!selected) return;
    try {
      const res = await fetch("/api/admin/media", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, patch: { deletedAt: null } }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Restore failed");
      await refresh();
      toast.success("Restored");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Restore failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Heading level="h1">Media Library</Heading>
          <Text className="text-muted-foreground mt-1">
            Upload and manage all website/admin media. For the homepage gallery, upload to the{" "}
            <strong>Gallery</strong> folder with <strong>Public</strong> visibility, then refresh
            the homepage.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => void refresh()} loading={isRefreshing}>
            Refresh
          </Button>
          <Button onClick={onPickFiles}>Upload</Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept="image/*,video/mp4,video/webm,image/svg+xml"
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length) enqueueFiles(files);
              e.currentTarget.value = "";
            }}
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)_360px]">
        <aside className="space-y-4">
          <AnalyticsCard title="Folders" description="Filter by category.">
            <div className="space-y-1">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={cn(
                    "w-full rounded-[var(--radius-md)] border px-3 py-2 text-left text-sm transition-colors",
                    category === c.id
                      ? "border-primary bg-primary/10"
                      : "border-border/70 hover:bg-muted/20",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </AnalyticsCard>

          <AnalyticsCard title="Filters" description="Search and visibility filters.">
            <div className="space-y-3">
              <Input
                placeholder="Search filename, caption…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as never)}
                className="border-input bg-background h-10 w-full rounded-[var(--radius-md)] border px-3 text-sm"
              >
                {VISIBILITY.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
              <Button variant="secondary" onClick={() => void refresh()}>
                Apply
              </Button>
            </div>
          </AnalyticsCard>
        </aside>

        <main className="min-w-0 space-y-6">
          <AnalyticsCard title="Media" description="Drag and drop files to upload.">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              className="border-border/70 rounded-[var(--radius-lg)] border border-dashed p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <Text size="sm" className="text-muted-foreground">
                  {hydrated ? `${assets.length} assets` : "Loading…"}
                </Text>
                <div className="flex gap-2">
                  <Badge variant="outline">Category: {category}</Badge>
                  <Badge variant="outline">Visibility: {visibility}</Badge>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {assets.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => setSelectedId(asset.id)}
                    className={cn(
                      "border-border/70 hover:bg-muted/20 overflow-hidden rounded-[var(--radius-lg)] border text-left transition-colors",
                      selectedId === asset.id ? "border-primary bg-primary/10" : "",
                    )}
                  >
                    <div className="bg-muted/20 relative aspect-[4/3] w-full overflow-hidden">
                      {asset.type === "video" ? (
                        <div className="flex h-full items-center justify-center">
                          <Text size="sm" className="text-muted-foreground">
                            Video
                          </Text>
                        </div>
                      ) : (
                        <Image
                          src={`/api/media/${asset.id}`}
                          alt={asset.altText ?? asset.filename}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="space-y-1 p-3">
                      <Text className="truncate font-medium">{asset.filename}</Text>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="secondary">{asset.type}</Badge>
                        <Badge variant="outline">{asset.visibility}</Badge>
                        {asset.deletedAt ? <Badge variant="destructive">Deleted</Badge> : null}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {assets.length === 0 ? (
                <div className="py-10 text-center">
                  <Text className="text-muted-foreground">No assets found.</Text>
                </div>
              ) : null}
            </div>
          </AnalyticsCard>

          {uploads.length > 0 ? (
            <AnalyticsCard title="Uploads" description="Queued uploads with retry.">
              <div className="space-y-2">
                {uploads.slice(0, 8).map((u) => (
                  <div key={u.id} className="border-border/70 flex items-center justify-between gap-3 rounded-[var(--radius-md)] border p-3">
                    <div className="min-w-0">
                      <Text className="truncate font-medium">{u.file.name}</Text>
                      <Text size="sm" className="text-muted-foreground">
                        {u.status === "queued" ? "Queued" : u.status === "uploading" ? "Uploading…" : u.status === "success" ? "Done" : u.error}
                      </Text>
                    </div>
                    {u.status === "error" ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void uploadQueued([u])}
                      >
                        Retry
                      </Button>
                    ) : (
                      <Badge variant="outline">{u.status}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </AnalyticsCard>
          ) : null}
        </main>

        <aside className="space-y-6">
          <AnalyticsCard title="Details" description="Edit metadata and visibility.">
            {!selected ? (
              <Text size="sm" className="text-muted-foreground">
                Select an asset to view details.
              </Text>
            ) : (
              <div className="space-y-4">
                <div className="bg-muted/20 relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-lg)]">
                  {selected.type === "video" ? (
                    <div className="flex h-full items-center justify-center">
                      <Text size="sm" className="text-muted-foreground">
                        Video preview via signed URL (todo)
                      </Text>
                    </div>
                  ) : (
                    <Image
                      src={`/api/media/${selected.id}`}
                      alt={selected.altText ?? selected.filename}
                      fill
                      sizes="360px"
                      className="object-cover"
                    />
                  )}
                </div>

                <div>
                  <Text size="sm" className="text-muted-foreground">
                    Filename
                  </Text>
                  <Text className="break-all font-medium">{selected.filename}</Text>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Text size="sm" className="text-muted-foreground">
                      Category
                    </Text>
                    <select
                      value={selected.category}
                      onChange={(e) => void updateSelected({ category: e.target.value as never })}
                      className="border-input bg-background mt-1 h-10 w-full rounded-[var(--radius-md)] border px-3 text-sm"
                    >
                      {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Text size="sm" className="text-muted-foreground">
                      Visibility
                    </Text>
                    <select
                      value={selected.visibility}
                      onChange={(e) =>
                        void updateSelected({ visibility: e.target.value as never })
                      }
                      className="border-input bg-background mt-1 h-10 w-full rounded-[var(--radius-md)] border px-3 text-sm"
                    >
                      {VISIBILITY.filter((v) => v.id !== "all").map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div>
                    <Text size="sm" className="text-muted-foreground">
                      Alt text
                    </Text>
                    <Input
                      className="mt-1"
                      value={selected.altText ?? ""}
                      onChange={(e) => setAssets((cur) =>
                        cur.map((a) => (a.id === selected.id ? { ...a, altText: e.target.value } : a)),
                      )}
                      onBlur={() => void updateSelected({ altText: selected.altText ?? "" })}
                      placeholder="Describe the image for accessibility"
                    />
                  </div>
                  <div>
                    <Text size="sm" className="text-muted-foreground">
                      Caption
                    </Text>
                    <Input
                      className="mt-1"
                      value={selected.caption ?? ""}
                      onChange={(e) => setAssets((cur) =>
                        cur.map((a) => (a.id === selected.id ? { ...a, caption: e.target.value } : a)),
                      )}
                      onBlur={() => void updateSelected({ caption: selected.caption ?? "" })}
                      placeholder="Optional caption"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selected.deletedAt ? (
                    <Button variant="secondary" onClick={() => void restoreSelected()}>
                      Restore
                    </Button>
                  ) : (
                    <Button variant="destructive" onClick={() => void softDeleteSelected()}>
                      Delete
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => {
                      void navigator.clipboard.writeText(`/api/media/${selected.id}`);
                      toast.success("Copied asset URL");
                    }}
                  >
                    Copy URL
                  </Button>
                </div>
              </div>
            )}
          </AnalyticsCard>
        </aside>
      </div>
    </div>
  );
}

