import { NextResponse } from "next/server";

import { getMediaAssetById } from "@/features/media/services/media.repository";
import { downloadFromStorage } from "@/features/media/services/storage.service";

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  const asset = await getMediaAssetById(id);
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (asset.deletedAt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (asset.visibility !== "public") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { data, contentType } = await downloadFromStorage({
      bucket: asset.bucket,
      objectPath: asset.objectPath,
    });

    const buffer = Buffer.from(await data.arrayBuffer());

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": asset.mimeType ?? contentType ?? "application/octet-stream",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
