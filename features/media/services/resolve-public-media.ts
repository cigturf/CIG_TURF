import { listMediaAssets } from "@/features/media/services/media.repository";
import type { MediaCategory } from "@/features/media/types";

export function buildPublicMediaUrl(assetId: string): string {
  return `/api/media/${assetId}`;
}

/** First public image in a category — used when Business Settings has no explicit URL. */
export async function resolvePublicMediaUrl(
  category: MediaCategory,
): Promise<string | null> {
  try {
    const assets = await listMediaAssets({
      category,
      visibility: "public",
      includeDeleted: false,
    });

    const image = assets.find((asset) => asset.type === "image");
    if (!image) return null;

    return buildPublicMediaUrl(image.id);
  } catch {
    return null;
  }
}

export async function resolvePublicLogoUrl(): Promise<string | null> {
  return resolvePublicMediaUrl("logos");
}
