import { describe, expect, it } from "vitest";

import { parseBusinessSettings } from "@/features/business-settings/lib/parse";

describe("parseBusinessSettings", () => {
  it("parses empty database object using defaults", () => {
    const parsed = parseBusinessSettings({});

    expect(parsed).not.toBeNull();
    expect(parsed?.emails.enableCustomerEmails).toBe(true);
    expect(parsed?.emails.fromName).toBeNull();
    expect(parsed?.metadata.version).toBe(0);
  });

  it("merges legacy email settings with new communication fields", () => {
    const parsed = parseBusinessSettings({
      emails: {
        bookingNotificationEmails: ["owner@example.com"],
        supportEmails: ["support@example.com"],
      },
    });

    expect(parsed?.emails.bookingNotificationEmails).toEqual(["owner@example.com"]);
    expect(parsed?.emails.enableOwnerEmails).toBe(true);
    expect(parsed?.emails.fromName).toBeNull();
  });
});
