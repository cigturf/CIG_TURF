import { describe, expect, it } from "vitest";

import {
  resolveContactNumbers,
  resolveWhatsappNumbers,
} from "@/features/business-settings/lib/contact-utils";
import { parseBusinessSettings } from "@/features/business-settings/lib/parse";

describe("contact-utils", () => {
  it("resolves multiple phone and whatsapp numbers", () => {
    expect(
      resolveContactNumbers({
        contactNumbers: ["+91 9193919798", "+91 9368332353"],
      }),
    ).toEqual(["+91 9193919798", "+91 9368332353"]);

    expect(
      resolveWhatsappNumbers({
        whatsappNumbers: ["9193919798 , 9368332353"],
        whatsappNumber: null,
      }),
    ).toEqual(["9193919798", "9368332353"]);
  });

  it("migrates legacy single whatsappNumber", () => {
    expect(
      resolveWhatsappNumbers({
        whatsappNumbers: null,
        whatsappNumber: "+91 9193919798",
      }),
    ).toEqual(["+91 9193919798"]);
  });
});

describe("parseBusinessSettings contact migration", () => {
  it("normalizes legacy whatsappNumber into whatsappNumbers", () => {
    const parsed = parseBusinessSettings({
      contact: {
        whatsappNumber: "+91 9193919798",
      },
    });

    expect(parsed?.contact.whatsappNumbers).toEqual(["+91 9193919798"]);
  });
});
