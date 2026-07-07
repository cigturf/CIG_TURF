export type {
  EmailBrandingContext,
  EmailLogRecord,
  EmailLogStatus,
  EmailTemplateId,
  SendEmailInput,
} from "@/features/communication/types/email.types";
export {
  EMAIL_MAX_RETRIES,
  EMAIL_TEMPLATES,
  PREVIEW_TEMPLATE_IDS,
} from "@/features/communication/types/email.types";
export { CommunicationService } from "@/features/communication/services/communication.service";
export {
  registerCommunicationEventHandlers,
  publishCommunicationEvent,
} from "@/features/communication/services/communication-dispatcher";
export { listEmailLogs } from "@/features/communication/services/email-log.repository";
export {
  buildPreviewRenderInput,
  renderEmailTemplate,
} from "@/features/communication/templates/render-email-template";
export { loadEmailBrandingContext } from "@/features/communication/lib/build-email-branding";
export { isEmailDevMode } from "@/features/communication/providers/resolve-email-provider";
