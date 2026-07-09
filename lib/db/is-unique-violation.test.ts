import { describe, expect, it } from "vitest";

import { isUniqueViolation } from "@/lib/db/is-unique-violation";

describe("isUniqueViolation", () => {
  it("detects postgres unique violation code", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
  });

  it("detects unique errors from Error message", () => {
    expect(isUniqueViolation(new Error("duplicate key value violates unique constraint"))).toBe(
      true,
    );
  });

  it("returns false for unrelated errors", () => {
    expect(isUniqueViolation(new Error("connection timeout"))).toBe(false);
  });
});
