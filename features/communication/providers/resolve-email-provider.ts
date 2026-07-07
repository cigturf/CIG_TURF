import { BrevoEmailProvider } from "@/features/communication/providers/brevo.provider";
import { ConsoleEmailProvider } from "@/features/communication/providers/console.provider";
import type { EmailProvider } from "@/features/communication/providers/email-provider";

let cachedProvider: EmailProvider | null = null;

export function resolveEmailProvider(): EmailProvider {
  if (cachedProvider) return cachedProvider;

  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();

  if (apiKey && senderEmail) {
    cachedProvider = new BrevoEmailProvider(apiKey, senderEmail);
    return cachedProvider;
  }

  cachedProvider = new ConsoleEmailProvider();
  return cachedProvider;
}

export function isEmailDevMode(): boolean {
  return !(process.env.BREVO_API_KEY?.trim() && process.env.BREVO_SENDER_EMAIL?.trim());
}
