import type { EmailProvider } from "@/features/communication/providers/email-provider";
import type { EmailProviderResult, SendEmailInput } from "@/features/communication/types/email.types";

export class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console";

  async send(input: SendEmailInput): Promise<EmailProviderResult> {
    console.info("[CommunicationCenter][DevMode] Email queued for console delivery", {
      to: input.to,
      subject: input.subject,
      replyTo: input.replyTo,
      fromName: input.fromName,
      htmlLength: input.html.length,
    });
    return { success: true, messageId: `dev-${Date.now()}` };
  }
}
