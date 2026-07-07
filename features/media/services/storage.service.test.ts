import { describe, expect, it } from "vitest";

import { validateUploadFile } from "@/features/media/services/storage.service";

function fileWithBytes(name: string, type: string, bytes: number[]): File {
  const buffer = new Uint8Array(bytes);
  return new File([buffer], name, { type });
}

describe("upload validation", () => {
  it("rejects executable extensions", () => {
    const file = new File([new Uint8Array([1, 2, 3])], "virus.exe", {
      type: "application/octet-stream",
    });
    expect(validateUploadFile(file).ok).toBe(false);
  });

  it("rejects mismatched magic bytes", () => {
    const file = fileWithBytes("photo.jpg", "image/jpeg", [0x00, 0x00, 0x00]);
    const buffer = new Uint8Array([0x00, 0x00, 0x00]).buffer;
    expect(validateUploadFile(file, buffer).ok).toBe(false);
  });

  it("accepts valid jpeg uploads", () => {
    const bytes = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10];
    const file = fileWithBytes("photo.jpg", "image/jpeg", bytes);
    const buffer = new Uint8Array(bytes).buffer;
    expect(validateUploadFile(file, buffer).ok).toBe(true);
  });
});
