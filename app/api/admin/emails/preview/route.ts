import { NextResponse } from "next/server";
import { z } from "zod";

import {
  buildPreviewRenderInput,
  renderEmailTemplate,
} from "@/features/communication/templates/render-email-template";
import { EMAIL_TEMPLATES } from "@/features/communication/types/email.types";
import { loadEmailBrandingContext } from "@/features/communication/lib/build-email-branding";
import { parseJsonBody } from "@/lib/api/parse-request";
import { requireAdminSession } from "@/lib/api/require-admin";

const previewSchema = z.object({
  template: z.enum([
    EMAIL_TEMPLATES.BOOKING_CONFIRMED,
    EMAIL_TEMPLATES.PAYMENT_RECEIVED,
    EMAIL_TEMPLATES.BOOKING_CANCELLED,
    EMAIL_TEMPLATES.OWNER_NEW_BOOKING,
    EMAIL_TEMPLATES.OWNER_MANUAL_BOOKING,
    EMAIL_TEMPLATES.OWNER_BOOKING_CANCELLED,
    EMAIL_TEMPLATES.OWNER_PAYMENT_COLLECTED,
    EMAIL_TEMPLATES.OWNER_PAYMENT_FAILED,
    EMAIL_TEMPLATES.PAYMENT_REMINDER,
    EMAIL_TEMPLATES.WELCOME,
    EMAIL_TEMPLATES.OWNER_CRITICAL_ERROR,
    EMAIL_TEMPLATES.BOOKING_RESCHEDULED,
  ]),
});

export async function POST(request: Request) {
  const auth = await requireAdminSession("emails.view");
  if ("error" in auth) return auth.error;

  const parsed = await parseJsonBody(request, previewSchema);
  if (!parsed.success) return parsed.response;

  const { branding } = await loadEmailBrandingContext();
  const input = buildPreviewRenderInput(parsed.data.template, branding);
  const rendered = renderEmailTemplate(input);

  return NextResponse.json({
    subject: rendered.subject,
    html: rendered.html,
    template: parsed.data.template,
  });
}
