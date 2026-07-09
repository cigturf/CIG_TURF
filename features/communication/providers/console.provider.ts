import {
  TRANSACTIONAL_EMAIL_REPLY_TO,
  TRANSACTIONAL_EMAIL_SENDER_NAME,
} from "@/features/communication/constants/email.constants";
import type { EmailProvider } from "@/features/communication/providers/email-provider";
import type { EmailProviderResult, SendEmailInput } from "@/features/communication/types/email.types";

export class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console";

  async send(input: SendEmailInput): Promise<EmailProviderResult> {
    console.info("[CommunicationCenter][DevMode] Email queued for console delivery", {
      to: input.to,
      subject: input.subject,
      from: `${TRANSACTIONAL_EMAIL_SENDER_NAME} <dev-sender@localhost>`,
      replyTo: TRANSACTIONAL_EMAIL_REPLY_TO,
      htmlLength: input.html.length,
    });
    return { success: true, messageId: `dev-${Date.now()}` };
  }
}
