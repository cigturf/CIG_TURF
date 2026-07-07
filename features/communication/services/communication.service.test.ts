import { describe, expect, it } from "vitest";

import { buildEmailBrandingFromSettings } from "@/features/communication/lib/build-email-branding";
import { createEmptyBusinessSettings } from "@/features/business-settings/lib/defaults";
import {
  buildPreviewRenderInput,
  renderEmailTemplate,
} from "@/features/communication/templates/render-email-template";
import { EMAIL_TEMPLATES } from "@/features/communication/types/email.types";
import { ConsoleEmailProvider } from "@/features/communication/providers/console.provider";
import { isEmailDevMode } from "@/features/communication/providers/resolve-email-provider";

describe("communication templates", () => {
  it("renders booking confirmation with business branding", () => {
    const settings = createEmptyBusinessSettings();
    settings.branding.businessName = "Chandana Indoor Ground";
    settings.contact.address = "Main Road";
    settings.contact.city = "Hyderabad";
    settings.emails.supportEmails = ["support@cig.example"];

    const branding = buildEmailBrandingFromSettings(settings);
    const input = buildPreviewRenderInput(EMAIL_TEMPLATES.BOOKING_CONFIRMED, branding);
    const rendered = renderEmailTemplate(input);

    expect(rendered.subject).toContain("CIG-");
    expect(rendered.html).toContain("Chandana Indoor Ground");
    expect(rendered.html).toContain("Booking Confirmed");
    expect(rendered.html).toContain("Manage Booking");
  });
});

describe("console email provider", () => {
  it("sends without error in dev mode", async () => {
    const provider = new ConsoleEmailProvider();
    const result = await provider.send({
      to: "test@example.com",
      subject: "Test",
      html: "<p>Hello</p>",
    });
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });
});

describe("email dev mode", () => {
  it("detects missing brevo credentials", () => {
    const originalKey = process.env.BREVO_API_KEY;
    const originalSender = process.env.BREVO_SENDER_EMAIL;
    delete process.env.BREVO_API_KEY;
    delete process.env.BREVO_SENDER_EMAIL;
    expect(isEmailDevMode()).toBe(true);
    process.env.BREVO_API_KEY = originalKey;
    process.env.BREVO_SENDER_EMAIL = originalSender;
  });
});
