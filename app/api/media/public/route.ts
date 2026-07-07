import { API_CACHE_SECONDS } from "@/config/cache.config";
import type { MediaCategory, MediaAssetPublic } from "@/features/media/types";
import { listMediaAssets } from "@/features/media/services";
import { jsonWithPublicCache } from "@/lib/api/cache-response";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as MediaCategory | null;

  const assets = await listMediaAssets({
    category: category ?? "all",
    visibility: "public",
    includeDeleted: false,
  });

  const publicAssets: MediaAssetPublic[] = assets.map((asset) => ({
    id: asset.id,
    filename: asset.filename,
    type: asset.type,
    category: asset.category,
    altText: asset.altText,
    caption: asset.caption,
    sortOrder: asset.sortOrder,
    width: asset.width,
    height: asset.height,
    durationSeconds: asset.durationSeconds,
    src: `/api/media/${asset.id}`,
  }));

  return jsonWithPublicCache({ assets: publicAssets }, API_CACHE_SECONDS.media);
}

