import crypto from "crypto";

import { createServiceRoleClient } from "@/lib/supabase/admin";

const DEFAULT_BUCKET = "media";

export type UploadValidationResult =
  | { ok: true }
  | { ok: false; error: string };

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
]);

const MAGIC_BYTES: Array<{ mime: string; bytes: number[] }> = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/gif", bytes: [0x47, 0x49, 0x46] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] },
  { mime: "video/mp4", bytes: [0x00, 0x00, 0x00] },
  { mime: "video/webm", bytes: [0x1a, 0x45, 0xdf, 0xa3] },
];

export const ALLOWED_UPLOAD_BUCKET = DEFAULT_BUCKET;

function matchesMagicBytes(buffer: ArrayBuffer, mime: string): boolean {
  const bytes = new Uint8Array(buffer.slice(0, 12));
  const signature = MAGIC_BYTES.find((item) => item.mime === mime);
  if (!signature) return false;

  if (mime === "video/mp4") {
    return bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70;
  }

  return signature.bytes.every((value, index) => bytes[index] === value);
}

export function validateUploadFile(file: File, buffer?: ArrayBuffer): UploadValidationResult {
  if (!file || !file.name) return { ok: false, error: "Missing file" };
  if (file.size <= 0) return { ok: false, error: "File is empty" };
  if (file.size > 50 * 1024 * 1024) return { ok: false, error: "File is too large (max 50MB)" };

  const type = file.type || "";
  if (!ALLOWED_MIME_TYPES.has(type)) {
    return { ok: false, error: `Unsupported file type: ${type || "unknown"}` };
  }

  const lowered = file.name.toLowerCase();
  if (/\.(exe|dll|sh|bat|cmd|js|mjs|cjs|php|py|rb|pl|svg|html|htm)$/.test(lowered)) {
    return { ok: false, error: "Executable or unsafe uploads are not allowed" };
  }

  if (buffer && !matchesMagicBytes(buffer, type)) {
    return { ok: false, error: "File content does not match declared type" };
  }

  return { ok: true };
}

export function sha256Hex(buffer: ArrayBuffer): string {
  return crypto.createHash("sha256").update(Buffer.from(buffer)).digest("hex");
}

export function buildObjectPath(params: {
  category: string;
  filename: string;
  checksumSha256: string;
}): string {
  const safeName = params.filename.replace(/[^\w.\-()+ ]/g, "_").replace(/\s+/g, " ").trim();
  const prefix = params.checksumSha256.slice(0, 12);
  return `${params.category}/${prefix}-${safeName}`;
}

export async function uploadToStorage(params: {
  bucket?: string;
  objectPath: string;
  file: File;
}): Promise<{ bucket: string; objectPath: string }> {
  const supabase = createServiceRoleClient();
  if (!supabase) throw new Error("Supabase Storage is not configured");

  const bucket = params.bucket ?? DEFAULT_BUCKET;
  if (bucket !== DEFAULT_BUCKET) {
    throw new Error("Invalid storage bucket");
  }

  const { error } = await supabase.storage
    .from(bucket)
    .upload(params.objectPath, params.file, {
      upsert: false,
      contentType: params.file.type,
      cacheControl: "3600",
    });

  if (error) throw new Error(error.message);
  return { bucket, objectPath: params.objectPath };
}

export async function createSignedAssetUrl(params: {
  bucket?: string;
  objectPath: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const supabase = createServiceRoleClient();
  if (!supabase) throw new Error("Supabase Storage is not configured");

  const bucket = params.bucket ?? DEFAULT_BUCKET;
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(params.objectPath, params.expiresInSeconds ?? 60 * 15);

  if (error) throw new Error(error.message);
  if (!data?.signedUrl) throw new Error("Failed to create signed URL");
  return data.signedUrl;
}

export async function removeFromStorage(params: {
  bucket?: string;
  objectPath: string;
}): Promise<void> {
  const supabase = createServiceRoleClient();
  if (!supabase) throw new Error("Supabase Storage is not configured");

  const bucket = params.bucket ?? DEFAULT_BUCKET;
  const { error } = await supabase.storage.from(bucket).remove([params.objectPath]);
  if (error) throw new Error(error.message);
}

export async function downloadFromStorage(params: {
  bucket?: string;
  objectPath: string;
}): Promise<{ data: Blob; contentType: string | null }> {
  const supabase = createServiceRoleClient();
  if (!supabase) throw new Error("Supabase Storage is not configured");

  const bucket = params.bucket ?? DEFAULT_BUCKET;
  const { data, error } = await supabase.storage.from(bucket).download(params.objectPath);
  if (error || !data) throw new Error(error?.message ?? "Failed to download file");

  return { data, contentType: data.type || null };
}
