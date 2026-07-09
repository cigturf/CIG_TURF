import { describe, expect, it } from "vitest";

import {
  TRANSACTIONAL_EMAIL_REPLY_TO,
  TRANSACTIONAL_EMAIL_SENDER_NAME,
  TRANSACTIONAL_EMAIL_SUPPORT_ADDRESS,
  TRANSACTIONAL_EMAIL_SUPPORT_HOURS,
  TRANSACTIONAL_EMAIL_WHATSAPP_NUMBERS,
} from "@/features/communication/constants/email.constants";
import { buildEmailBrandingFromSettings } from "@/features/communication/lib/build-email-branding";
import { createEmptyBusinessSettings } from "@/features/business-settings/lib/defaults";
import { renderEmailLayout } from "@/features/communication/templates/email-layout";
import {
  buildPreviewRenderInput,
  renderEmailTemplate,
} from "@/features/communication/templates/render-email-template";
import { EMAIL_TEMPLATES } from "@/features/communication/types/email.types";

describe("renderEmailLayout", () => {
  it("renders the production support footer on every layout", () => {
    const settings = createEmptyBusinessSettings();
    const branding = buildEmailBrandingFromSettings(settings);

    const html = renderEmailLayout({
      branding,
      title: "Booking Confirmed",
      bodyHtml: "<p>Test body</p>",
    });

    expect(html).toContain("Need help with your booking?");
    expect(html).toContain(TRANSACTIONAL_EMAIL_SUPPORT_ADDRESS);
    expect(html).toContain(TRANSACTIONAL_EMAIL_WHATSAPP_NUMBERS[0]);
    expect(html).toContain(TRANSACTIONAL_EMAIL_WHATSAPP_NUMBERS[1]);
    expect(html).toContain(TRANSACTIONAL_EMAIL_SUPPORT_HOURS);
    expect(html).toContain(`Thank you for choosing ${TRANSACTIONAL_EMAIL_SENDER_NAME}.`);
    expect(html).toContain("This is an automated email.");
    expect(html).toContain('meta name="color-scheme" content="light dark"');
  });

  it("includes configured whatsapp numbers in the shared footer", () => {
    const settings = createEmptyBusinessSettings();
    settings.contact.whatsappNumbers = ["+91 9193919798", "+91 9368332353"];
    const branding = buildEmailBrandingFromSettings(settings);

    const html = renderEmailLayout({
      branding,
      title: "Payment Received",
      bodyHtml: "<p>Test</p>",
    });

    expect(html).toContain("+91 9193919798");
    expect(html).toContain("+91 9368332353");
  });
});

describe("communication templates", () => {
  it("renders booking confirmation with business branding and shared footer", () => {
    const settings = createEmptyBusinessSettings();
    settings.branding.businessName = "Chandna Indoor Ground";
    settings.contact.address = "Main Road";
    settings.contact.city = "Hyderabad";
    settings.emails.supportEmails = ["support@cig.example"];

    const branding = buildEmailBrandingFromSettings(settings);
    const input = buildPreviewRenderInput(EMAIL_TEMPLATES.BOOKING_CONFIRMED, branding);
    const rendered = renderEmailTemplate(input);

    expect(rendered.subject).toContain("CIG-");
    expect(rendered.html).toContain("Chandna Indoor Ground");
    expect(rendered.html).toContain("Booking Confirmed");
    expect(rendered.html).toContain("Manage Booking");
    expect(rendered.html).toContain(TRANSACTIONAL_EMAIL_SUPPORT_ADDRESS);
  });

  it("includes the shared footer across transactional templates", () => {
    const branding = buildEmailBrandingFromSettings(createEmptyBusinessSettings());
    const templates = [
      EMAIL_TEMPLATES.BOOKING_CONFIRMED,
      EMAIL_TEMPLATES.BOOKING_CANCELLED,
      EMAIL_TEMPLATES.PAYMENT_RECEIVED,
      EMAIL_TEMPLATES.OWNER_PAYMENT_FAILED,
      EMAIL_TEMPLATES.OWNER_CRITICAL_ERROR,
    ] as const;

    for (const template of templates) {
      const rendered = renderEmailTemplate(buildPreviewRenderInput(template, branding));
      expect(rendered.html).toContain("Need help with your booking?");
      expect(rendered.html).toContain(TRANSACTIONAL_EMAIL_REPLY_TO);
    }
  });
});
