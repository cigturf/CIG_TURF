import type { EmailProvider } from "@/features/communication/providers/email-provider";
import {
  TRANSACTIONAL_EMAIL_REPLY_TO,
  TRANSACTIONAL_EMAIL_SENDER_NAME,
} from "@/features/communication/constants/email.constants";
import type { EmailProviderResult, SendEmailInput } from "@/features/communication/types/email.types";

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 400;

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class BrevoEmailProvider implements EmailProvider {
  readonly name = "brevo";

  constructor(
    private readonly apiKey: string,
    private readonly senderEmail: string,
    private readonly replyToEmail: string = TRANSACTIONAL_EMAIL_REPLY_TO,
  ) {}

  async send(input: SendEmailInput): Promise<EmailProviderResult> {
    const body = JSON.stringify({
      sender: { name: TRANSACTIONAL_EMAIL_SENDER_NAME, email: this.senderEmail },
      to: [{ email: input.to }],
      subject: input.subject,
      htmlContent: input.html,
      replyTo: { email: this.replyToEmail },
    });

    let lastError = "Brevo request failed";

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": this.apiKey,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body,
        });

        if (response.ok) {
          const data = (await response.json()) as { messageId?: string };
          return { success: true, messageId: data.messageId };
        }

        const errorBody = (await response.json().catch(() => ({}))) as { message?: string };
        lastError = errorBody.message ?? `Brevo API error (${response.status})`;

        if (!isRetryableStatus(response.status) || attempt === MAX_ATTEMPTS) {
          return { success: false, error: lastError };
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Brevo request failed";
        if (attempt === MAX_ATTEMPTS) {
          return { success: false, error: lastError };
        }
      }

      await wait(BASE_DELAY_MS * attempt);
    }

    return { success: false, error: lastError };
  }
}
