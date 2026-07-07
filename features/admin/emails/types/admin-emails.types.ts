import type { EmailLogRecord } from "@/features/communication/types/email.types";

export type EmailDirectoryData = {
  logs: EmailLogRecord[];
  devMode: boolean;
};
