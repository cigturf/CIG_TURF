import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminSession } from "@/lib/api/require-admin";
import type { MediaListQuery } from "@/features/media/types";
import { listMediaAssets, updateMediaAsset } from "@/features/media/services";
import {
  ALLOWED_UPLOAD_BUCKET,
  buildObjectPath,
  sha256Hex,
  uploadToStorage,
  validateUploadFile,
} from "@/features/media/services";
import { createMediaAsset } from "@/features/media/services/media.repository";
import { parseJsonBody } from "@/lib/api/parse-request";
import { sanitizePlainText, sanitizeRichText } from "@/lib/security/sanitize";

const mediaUpdateSchema = z
  .object({
    id: z.string().min(1).max(128),
    patch: z
      .object({
        category: z.string().min(1).max(64).optional(),
        visibility: z.enum(["public", "private"]).optional(),
        altText: z.string().max(500).nullable().optional(),
        caption: z.string().max(2000).nullable().optional(),
        sortOrder: z.number().int().min(0).max(10_000).optional(),
        deletedAt: z.string().nullable().optional(),
      })
      .strict(),
  })
  .strict();

export async function GET(request: Request) {
  const auth = await requireAdminSession("gallery.view");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const query: MediaListQuery = {
    search: searchParams.get("search") ?? undefined,
    category: (searchParams.get("category") as MediaListQuery["category"]) ?? undefined,
    type: (searchParams.get("type") as MediaListQuery["type"]) ?? undefined,
    visibility: (searchParams.get("visibility") as MediaListQuery["visibility"]) ?? undefined,
    includeDeleted: searchParams.get("includeDeleted") === "true",
  };

  const assets = await listMediaAssets(query);
  return NextResponse.json({ assets });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession("gallery.manage");
  if ("error" in auth) return auth.error;

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const validated = validateUploadFile(file, buffer);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const category = sanitizePlainText(String(form.get("category") ?? "misc"), 64) ?? "misc";
    const visibility = String(form.get("visibility") ?? "public");
    const type = String(form.get("type") ?? inferAssetTypeFromMime(file.type, file.name));
    const altText = sanitizePlainText(form.get("altText") ? String(form.get("altText")) : null, 500);
    const caption = sanitizeRichText(form.get("caption") ? String(form.get("caption")) : null);
    const bucket = ALLOWED_UPLOAD_BUCKET;

    const checksumSha256 = sha256Hex(buffer);
    const objectPath = buildObjectPath({
      category,
      filename: file.name,
      checksumSha256,
    });

    await uploadToStorage({ bucket, objectPath, file });

    const asset = await createMediaAsset({
      bucket,
      objectPath,
      filename: file.name,
      type: type as never,
      category: category as never,
      visibility: visibility as never,
      mimeType: file.type ?? null,
      sizeBytes: file.size ?? null,
      width: null,
      height: null,
      durationSeconds: null,
      checksumSha256,
      uploadedBy: auth.admin.userId,
      altText,
      caption,
    });

    revalidatePath("/");

    return NextResponse.json({ asset });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create media asset" },
      { status: 400 },
    );
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdminSession("gallery.manage");
  if ("error" in auth) return auth.error;

  const parsed = await parseJsonBody(request, mediaUpdateSchema);
  if (!parsed.success) return parsed.response;

  try {
    const patch = {
      ...parsed.data.patch,
      altText:
        parsed.data.patch.altText === undefined
          ? undefined
          : sanitizePlainText(parsed.data.patch.altText, 500),
      caption:
        parsed.data.patch.caption === undefined
          ? undefined
          : sanitizeRichText(parsed.data.patch.caption),
    };

    const updated = await updateMediaAsset(parsed.data.id, patch as never);
    revalidatePath("/");
    return NextResponse.json({ asset: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update media asset" },
      { status: 400 },
    );
  }
}

function inferAssetTypeFromMime(mime: string, filename: string): string {
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("image/")) return "image";
  if (filename.toLowerCase().endsWith(".svg")) return "image";
  return "other";
}
