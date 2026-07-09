import { describe, expect, it } from "vitest";

import { TRANSACTIONAL_EMAIL_REPLY_TO } from "@/features/communication/constants/email.constants";
import { ConsoleEmailProvider } from "@/features/communication/providers/console.provider";
import { isEmailDevMode } from "@/features/communication/providers/resolve-email-provider";

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

  it("uses the global reply-to constant in production configuration", () => {
    expect(TRANSACTIONAL_EMAIL_REPLY_TO).toBe("cigturf@gmail.com");
  });
});
