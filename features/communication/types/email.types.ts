export const EMAIL_TEMPLATES = {
  BOOKING_CONFIRMED: "booking_confirmed",
  BOOKING_CANCELLED: "booking_cancelled",
  BOOKING_RESCHEDULED: "booking_rescheduled",
  PAYMENT_RECEIVED: "payment_received",
  PAYMENT_REMINDER: "payment_reminder",
  WELCOME: "welcome",
  OWNER_NEW_BOOKING: "owner_new_booking",
  OWNER_BOOKING_CANCELLED: "owner_booking_cancelled",
  OWNER_MANUAL_BOOKING: "owner_manual_booking",
  OWNER_PAYMENT_COLLECTED: "owner_payment_collected",
  OWNER_PAYMENT_FAILED: "owner_payment_failed",
  OWNER_CRITICAL_ERROR: "owner_critical_error",
} as const;

export type EmailTemplateId = (typeof EMAIL_TEMPLATES)[keyof typeof EMAIL_TEMPLATES];

export type EmailLogStatus = "queued" | "sent" | "failed";

export type EmailLogRecord = {
  id: string;
  recipient: string;
  template: EmailTemplateId;
  subject: string;
  status: EmailLogStatus;
  retries: number;
  maxRetries: number;
  errorMessage: string | null;
  bookingId: string | null;
  metadata: Record<string, unknown> | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string | null;
  fromName?: string | null;
};

export type EmailProviderResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

export type EmailBrandingContext = {
  businessName: string;
  logoUrl: string | null;
  phone: string | null;
  contactNumbers: string[];
  whatsappNumbers: string[];
  supportEmail: string | null;
  address: string | null;
  googleMapsLink: string | null;
  websiteUrl: string | null;
  socialInstagram: string | null;
  socialFacebook: string | null;
  fromName: string;
  replyTo: string | null;
  accentColor: string;
  appUrl: string;
};

export type CommunicationSettings = {
  fromName: string | null;
  replyToEmail: string | null;
  ownerNotificationEmails: string[];
  supportEmails: string[];
  enableCustomerEmails: boolean;
  enableOwnerEmails: boolean;
};

export const EMAIL_MAX_RETRIES = 3;

export const PREVIEW_TEMPLATE_IDS: EmailTemplateId[] = [
  EMAIL_TEMPLATES.BOOKING_CONFIRMED,
  EMAIL_TEMPLATES.PAYMENT_RECEIVED,
  EMAIL_TEMPLATES.BOOKING_CANCELLED,
  EMAIL_TEMPLATES.OWNER_NEW_BOOKING,
];
