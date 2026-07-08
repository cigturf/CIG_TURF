import { describe, expect, it } from "vitest";

import {
  serializeUnknownError,
  serializeUnknownErrorDetails,
} from "@/lib/errors/serialize-error";

describe("serializeUnknownError", () => {
  it("extracts message from Error instances", () => {
    expect(serializeUnknownError(new Error("boom"))).toBe("boom");
  });

  it("extracts Razorpay-style error objects", () => {
    expect(
      serializeUnknownError({
        statusCode: 400,
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "Receipt length must be no more than 40",
        },
      }),
    ).toBe("Receipt length must be no more than 40");
  });

  it("stringifies unknown objects", () => {
    expect(serializeUnknownError({ code: "42P01" })).toBe('{"code":"42P01"}');
  });

  it("returns structured details", () => {
    expect(serializeUnknownErrorDetails(new Error("boom"))).toEqual({
      name: "Error",
      message: "boom",
      stack: expect.any(String),
    });
  });
});
