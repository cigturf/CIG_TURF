import type { EmailProvider } from "@/features/communication/providers/email-provider";
import type { EmailProviderResult, SendEmailInput } from "@/features/communication/types/email.types";

export class BrevoEmailProvider implements EmailProvider {
  readonly name = "brevo";

  constructor(
    private readonly apiKey: string,
    private readonly senderEmail: string,
  ) {}

  async send(input: SendEmailInput): Promise<EmailProviderResult> {
    const fromName = input.fromName?.trim() || "CIG Turf Booking";
    const senderEmail = this.senderEmail;

    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": this.apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sender: { name: fromName, email: senderEmail },
          to: [{ email: input.to }],
          subject: input.subject,
          htmlContent: input.html,
          replyTo: input.replyTo ? { email: input.replyTo } : undefined,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { message?: string };
        return {
          success: false,
          error: body.message ?? `Brevo API error (${response.status})`,
        };
      }

      const data = (await response.json()) as { messageId?: string };
      return { success: true, messageId: data.messageId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Brevo request failed",
      };
    }
  }
}
