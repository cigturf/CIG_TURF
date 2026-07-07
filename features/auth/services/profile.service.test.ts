import { describe, expect, it } from "vitest";

import { isProfileComplete } from "@/features/auth/utils/profile";

describe("profile utils", () => {
  it("treats profile as complete when name and phone exist", () => {
    expect(
      isProfileComplete({
        id: "user-1",
        email: "player@example.com",
        name: "Player",
        phone: "9876543210",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toBe(true);
  });

  it("treats missing profile as incomplete", () => {
    expect(isProfileComplete(null)).toBe(false);
  });

  it("treats profile without phone as incomplete", () => {
    expect(
      isProfileComplete({
        id: "user-1",
        email: "player@example.com",
        name: "Player",
        phone: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toBe(false);
  });
});
