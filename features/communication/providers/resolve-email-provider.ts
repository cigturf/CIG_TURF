import { BrevoEmailProvider } from "@/features/communication/providers/brevo.provider";
import { ConsoleEmailProvider } from "@/features/communication/providers/console.provider";
import type { EmailProvider } from "@/features/communication/providers/email-provider";
import { TRANSACTIONAL_EMAIL_REPLY_TO } from "@/features/communication/constants/email.constants";
import { env } from "@/lib/env";

let cachedProvider: EmailProvider | null = null;

export function resolveEmailProvider(): EmailProvider {
  if (cachedProvider) return cachedProvider;

  if (env.email.isConfigured) {
    cachedProvider = new BrevoEmailProvider(
      env.email.apiKey,
      env.email.senderEmail,
      TRANSACTIONAL_EMAIL_REPLY_TO,
    );
    return cachedProvider;
  }

  cachedProvider = new ConsoleEmailProvider();
  return cachedProvider;
}

export function isEmailDevMode(): boolean {
  return !env.email.isConfigured;
}
