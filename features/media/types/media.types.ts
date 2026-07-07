export type MediaAssetType = "image" | "video" | "svg" | "logo" | "icon" | "other";

export type MediaVisibility = "public" | "private" | "hidden";

export type MediaCategory =
  | "landing_hero"
  | "gallery"
  | "facilities"
  | "tournament"
  | "branding"
  | "logos"
  | "seo_images"
  | "promotional_banners"
  | "misc";

export type MediaAssetRecord = {
  id: string;
  filename: string;
  bucket: string;
  objectPath: string;
  type: MediaAssetType;
  category: MediaCategory;
  visibility: MediaVisibility;
  altText: string | null;
  caption: string | null;
  sortOrder: number;
  mimeType: string | null;
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  checksumSha256: string | null;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type MediaAssetPublic = Pick<
  MediaAssetRecord,
  | "id"
  | "filename"
  | "type"
  | "category"
  | "altText"
  | "caption"
  | "sortOrder"
  | "width"
  | "height"
  | "durationSeconds"
> & {
  /** Stable app URL that redirects to a signed storage URL */
  src: string;
};

export type MediaListQuery = {
  search?: string;
  category?: MediaCategory | "all";
  type?: MediaAssetType | "all";
  visibility?: MediaVisibility | "all";
  includeDeleted?: boolean;
};

