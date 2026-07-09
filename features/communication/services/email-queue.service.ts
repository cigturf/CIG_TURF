import { resolveEmailProvider } from "@/features/communication/providers/resolve-email-provider";
import {
  getEmailLogById,
  updateEmailLogStatus,
} from "@/features/communication/services/email-log.repository";
import { EMAIL_MAX_RETRIES } from "@/features/communication/types/email.types";

const processingIds = new Set<string>();

export async function processEmailLogById(logId: string): Promise<void> {
  if (processingIds.has(logId)) return;
  processingIds.add(logId);

  try {
    const log = await getEmailLogById(logId);
    if (!log || log.status === "sent") return;

    const metadata = log.metadata ?? {};
    const html = typeof metadata.html === "string" ? metadata.html : null;

    if (!html) {
      await updateEmailLogStatus(logId, {
        status: "failed",
        retries: log.retries + 1,
        errorMessage: "Missing rendered HTML payload",
      });
      return;
    }

    const provider = resolveEmailProvider();
    const result = await provider.send({
      to: log.recipient,
      subject: log.subject,
      html,
    });

    if (result.success) {
      await updateEmailLogStatus(logId, {
        status: "sent",
        retries: log.retries,
        errorMessage: null,
        sentAt: new Date(),
      });
      return;
    }

    const nextRetries = log.retries + 1;
    const failed = nextRetries >= (log.maxRetries || EMAIL_MAX_RETRIES);

    await updateEmailLogStatus(logId, {
      status: failed ? "failed" : "queued",
      retries: nextRetries,
      errorMessage: result.error ?? "Send failed",
    });

    if (!failed) {
      scheduleEmailRetry(logId, nextRetries);
    }
  } finally {
    processingIds.delete(logId);
  }
}

function scheduleEmailRetry(logId: string, attempt: number) {
  const delayMs = Math.min(30_000, 2_000 * 2 ** attempt);
  setTimeout(() => {
    void processEmailLogById(logId);
  }, delayMs);
}

export function queueEmailProcessing(logId: string): void {
  queueMicrotask(() => {
    void processEmailLogById(logId);
  });
}
