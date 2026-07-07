import type { EmailProviderResult, SendEmailInput } from "@/features/communication/types/email.types";

export interface EmailProvider {
  readonly name: string;
  send(input: SendEmailInput): Promise<EmailProviderResult>;
}
