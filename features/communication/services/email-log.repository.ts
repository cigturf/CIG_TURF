import { randomUUID } from "crypto";

import type {
  EmailLogRecord,
  EmailLogStatus,
  EmailTemplateId,
} from "@/features/communication/types/email.types";
import { EMAIL_MAX_RETRIES } from "@/features/communication/types/email.types";
import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type EmailLogRow = {
  id: string;
  recipient: string;
  template: string;
  subject: string;
  status: string;
  retries: number;
  max_retries: number;
  error_message: string | null;
  booking_id: string | null;
  metadata: Record<string, unknown> | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapRow(row: EmailLogRow): EmailLogRecord {
  return {
    id: row.id,
    recipient: row.recipient,
    template: row.template as EmailTemplateId,
    subject: row.subject,
    status: row.status as EmailLogStatus,
    retries: row.retries,
    maxRetries: row.max_retries,
    errorMessage: row.error_message,
    bookingId: row.booking_id,
    metadata: row.metadata,
    sentAt: row.sent_at ? new Date(row.sent_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function rowFromCreate(input: {
  id: string;
  recipient: string;
  template: EmailTemplateId;
  subject: string;
  bookingId?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const now = new Date().toISOString();
  return {
    id: input.id,
    recipient: input.recipient,
    template: input.template,
    subject: input.subject,
    status: "queued",
    retries: 0,
    max_retries: EMAIL_MAX_RETRIES,
    error_message: null,
    booking_id: input.bookingId ?? null,
    metadata: input.metadata ?? null,
    sent_at: null,
    created_at: now,
    updated_at: now,
  };
}

export async function createEmailLog(input: {
  recipient: string;
  template: EmailTemplateId;
  subject: string;
  bookingId?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<EmailLogRecord> {
  const id = randomUUID();
  const supabase = createServiceRoleClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("email_logs")
      .insert(rowFromCreate({ id, ...input }))
      .select("*")
      .single();

    if (!error && data) return mapRow(data as EmailLogRow);
    if (error && !error.message.includes("does not exist")) {
      console.error("[EmailLog] Supabase insert failed:", error.message);
    }
  }

  try {
    const row = await prisma.emailLog.create({
      data: {
        id,
        recipient: input.recipient,
        template: input.template,
        subject: input.subject,
        status: "queued",
        retries: 0,
        maxRetries: EMAIL_MAX_RETRIES,
        bookingId: input.bookingId ?? null,
        metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined,
      },
    });
    return {
      id: row.id,
      recipient: row.recipient,
      template: row.template as EmailTemplateId,
      subject: row.subject,
      status: row.status as EmailLogStatus,
      retries: row.retries,
      maxRetries: row.maxRetries,
      errorMessage: row.errorMessage,
      bookingId: row.bookingId,
      metadata: row.metadata as Record<string, unknown> | null,
      sentAt: row.sentAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  } catch (error) {
    console.error("[EmailLog] Prisma insert failed:", error);
    return {
      id,
      recipient: input.recipient,
      template: input.template,
      subject: input.subject,
      status: "queued",
      retries: 0,
      maxRetries: EMAIL_MAX_RETRIES,
      errorMessage: null,
      bookingId: input.bookingId ?? null,
      metadata: input.metadata ?? null,
      sentAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export async function updateEmailLogStatus(
  id: string,
  update: {
    status: EmailLogStatus;
    retries?: number;
    errorMessage?: string | null;
    sentAt?: Date | null;
  },
): Promise<void> {
  const now = new Date().toISOString();
  const supabase = createServiceRoleClient();

  if (supabase) {
    const { error } = await supabase
      .from("email_logs")
      .update({
        status: update.status,
        retries: update.retries,
        error_message: update.errorMessage ?? null,
        sent_at: update.sentAt?.toISOString() ?? null,
        updated_at: now,
      })
      .eq("id", id);

    if (!error) return;
    if (!error.message.includes("does not exist")) {
      console.error("[EmailLog] Supabase update failed:", error.message);
    }
  }

  try {
    await prisma.emailLog.update({
      where: { id },
      data: {
        status: update.status,
        retries: update.retries,
        errorMessage: update.errorMessage,
        sentAt: update.sentAt,
      },
    });
  } catch (error) {
    console.error("[EmailLog] Prisma update failed:", error);
  }
}

export async function getEmailLogById(id: string): Promise<EmailLogRecord | null> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase.from("email_logs").select("*").eq("id", id).maybeSingle();
    if (!error && data) return mapRow(data as EmailLogRow);
  }

  try {
    const row = await prisma.emailLog.findUnique({ where: { id } });
    if (!row) return null;
    return {
      id: row.id,
      recipient: row.recipient,
      template: row.template as EmailTemplateId,
      subject: row.subject,
      status: row.status as EmailLogStatus,
      retries: row.retries,
      maxRetries: row.maxRetries,
      errorMessage: row.errorMessage,
      bookingId: row.bookingId,
      metadata: row.metadata as Record<string, unknown> | null,
      sentAt: row.sentAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  } catch {
    return null;
  }
}

export async function hasSentTemplateRecently(
  recipient: string,
  template: EmailTemplateId,
  withinHours = 24 * 365,
): Promise<boolean> {
  const since = new Date(Date.now() - withinHours * 60 * 60 * 1000).toISOString();
  const supabase = createServiceRoleClient();

  if (supabase) {
    const { count, error } = await supabase
      .from("email_logs")
      .select("id", { count: "exact", head: true })
      .eq("recipient", recipient)
      .eq("template", template)
      .eq("status", "sent")
      .gte("created_at", since);

    if (!error && (count ?? 0) > 0) return true;
  }

  try {
    const count = await prisma.emailLog.count({
      where: {
        recipient,
        template,
        status: "sent",
        createdAt: { gte: new Date(since) },
      },
    });
    return count > 0;
  } catch {
    return false;
  }
}

export async function hasBookingNotificationPendingOrSent(
  bookingId: string,
  template: EmailTemplateId,
  recipient: string,
): Promise<boolean> {
  const normalizedRecipient = recipient.trim().toLowerCase();
  const supabase = createServiceRoleClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("email_logs")
      .select("recipient, status")
      .eq("booking_id", bookingId)
      .eq("template", template)
      .in("status", ["queued", "sent"]);

    if (!error && data) {
      return data.some(
        (row) => String(row.recipient).trim().toLowerCase() === normalizedRecipient,
      );
    }
  }

  try {
    const count = await prisma.emailLog.count({
      where: {
        bookingId,
        template,
        recipient: { equals: recipient.trim(), mode: "insensitive" },
        status: { in: ["queued", "sent"] },
      },
    });
    return count > 0;
  } catch {
    return false;
  }
}

export async function listEmailLogs(options?: {
  limit?: number;
  search?: string;
}): Promise<EmailLogRecord[]> {
  const limit = options?.limit ?? 100;
  const supabase = createServiceRoleClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("email_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!error && data) {
      const rows = (data as EmailLogRow[]).map(mapRow);
      if (!options?.search?.trim()) return rows;
      const term = options.search.trim().toLowerCase();
      return rows.filter(
        (row) =>
          row.recipient.toLowerCase().includes(term) ||
          row.template.toLowerCase().includes(term) ||
          row.subject.toLowerCase().includes(term),
      );
    }
    if (error && !error.message.includes("does not exist")) {
      console.error("[EmailLog] Supabase list failed:", error.message);
    }
  }

  try {
    const rows = await prisma.emailLog.findMany({
      where: options?.search
        ? {
            OR: [
              { recipient: { contains: options.search, mode: "insensitive" } },
              { template: { contains: options.search, mode: "insensitive" } },
              { subject: { contains: options.search, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return rows.map((row) => ({
      id: row.id,
      recipient: row.recipient,
      template: row.template as EmailTemplateId,
      subject: row.subject,
      status: row.status as EmailLogStatus,
      retries: row.retries,
      maxRetries: row.maxRetries,
      errorMessage: row.errorMessage,
      bookingId: row.bookingId,
      metadata: row.metadata as Record<string, unknown> | null,
      sentAt: row.sentAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  } catch {
    return [];
  }
}
