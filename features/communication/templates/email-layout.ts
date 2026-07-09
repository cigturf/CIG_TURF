import {
  TRANSACTIONAL_EMAIL_SENDER_NAME,
  TRANSACTIONAL_EMAIL_SUPPORT_ADDRESS,
  TRANSACTIONAL_EMAIL_SUPPORT_HOURS,
  TRANSACTIONAL_EMAIL_WHATSAPP_NUMBERS,
} from "@/features/communication/constants/email.constants";
import { escapeHtml } from "@/features/communication/lib/escape-html";
import type { EmailBrandingContext } from "@/features/communication/types/email.types";

export type EmailLayoutOptions = {
  branding: EmailBrandingContext;
  previewText?: string;
  title: string;
  bodyHtml: string;
  cta?: { label: string; href: string } | null;
};

function renderTransactionalFooter(branding: EmailBrandingContext): string {
  const whatsappNumbers =
    branding.whatsappNumbers.length > 0
      ? branding.whatsappNumbers
      : [...TRANSACTIONAL_EMAIL_WHATSAPP_NUMBERS];
  const whatsappLine = whatsappNumbers.map(escapeHtml).join(" or ");

  return `<hr class="email-footer-divider" style="border:none;border-top:1px solid #e2e8f0;margin:0 0 20px;" />
    <div class="email-footer-heading" style="margin:0 0 12px;font-size:14px;font-weight:600;color:#334155;">Need help with your booking?</div>
    <div class="email-footer-line" style="margin:0 0 8px;font-size:13px;line-height:1.7;color:#64748b;">
      <span aria-hidden="true">📧</span> Email:<br />
      <a class="email-footer-link" href="mailto:${escapeHtml(TRANSACTIONAL_EMAIL_SUPPORT_ADDRESS)}" style="color:#16a34a;text-decoration:none;">${escapeHtml(TRANSACTIONAL_EMAIL_SUPPORT_ADDRESS)}</a>
    </div>
    <div class="email-footer-line" style="margin:0 0 8px;font-size:13px;line-height:1.7;color:#64748b;">
      <span aria-hidden="true">💬</span> WhatsApp:<br />
      ${whatsappLine}
    </div>
    <div class="email-footer-line" style="margin:0 0 16px;font-size:13px;line-height:1.7;color:#64748b;">
      Support Hours:<br />
      ${escapeHtml(TRANSACTIONAL_EMAIL_SUPPORT_HOURS)}
    </div>
    <div class="email-footer-line" style="margin:0 0 12px;font-size:13px;line-height:1.7;color:#64748b;">
      Thank you for choosing ${escapeHtml(TRANSACTIONAL_EMAIL_SENDER_NAME)}.
    </div>
    <div class="email-footer-muted" style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">
      This is an automated email. Please do not share your OTP or payment information with anyone.
    </div>`;
}

export function renderEmailLayout(options: EmailLayoutOptions): string {
  const { branding, title, bodyHtml, previewText, cta } = options;
  const accent = branding.accentColor || "#16a34a";
  const logo = branding.logoUrl
    ? `<img src="${escapeHtml(branding.logoUrl)}" alt="${escapeHtml(branding.businessName)}" width="140" style="display:block;max-width:140px;height:auto;margin:0 auto;" />`
    : `<div style="font-size:22px;font-weight:700;color:#ffffff;text-align:center;">${escapeHtml(branding.businessName)}</div>`;

  const logoHeader = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:-32px -32px 24px;border-radius:16px 16px 0 0;overflow:hidden;">
    <tr>
      <td align="center" style="background:#000000;padding:28px 24px;">
        ${logo}
      </td>
    </tr>
  </table>`;

  const ctaBlock = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
        <tr>
          <td style="border-radius:10px;background:${accent};">
            <a href="${escapeHtml(cta.href)}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-weight:600;text-decoration:none;font-size:15px;">${escapeHtml(cta.label)}</a>
          </td>
        </tr>
      </table>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${escapeHtml(title)}</title>
  ${previewText ? `<meta name="x-preview-text" content="${escapeHtml(previewText)}" />` : ""}
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; padding: 16px !important; }
      .email-card { padding: 20px !important; }
    }
    @media (prefers-color-scheme: dark) {
      .email-shell { background:#0f172a !important; }
      .email-card { background:#1e293b !important; box-shadow:none !important; }
      .email-title { color:#f8fafc !important; }
      .email-body-text { color:#cbd5e1 !important; }
      .email-footer { color:#94a3b8 !important; }
      .email-footer-heading { color:#e2e8f0 !important; }
      .email-footer-line { color:#94a3b8 !important; }
      .email-footer-muted { color:#64748b !important; }
      .email-footer-divider { border-top-color:#334155 !important; }
      .email-footer-link { color:#4ade80 !important; }
      .email-detail-label { color:#94a3b8 !important; border-bottom-color:#334155 !important; }
      .email-detail-value { color:#f1f5f9 !important; border-bottom-color:#334155 !important; }
    }
  </style>
</head>
<body class="email-shell" style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(previewText ?? title)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-shell" style="background:#f1f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;">
          <tr>
            <td class="email-card" style="background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
              ${logoHeader}
              <h1 class="email-title" style="margin:0 0 20px;font-size:24px;line-height:1.3;text-align:center;color:#0f172a;">${escapeHtml(title)}</h1>
              ${bodyHtml}
              ${ctaBlock}
            </td>
          </tr>
          <tr>
            <td class="email-footer" style="padding:24px 8px 8px;text-align:center;font-size:13px;line-height:1.7;color:#64748b;">
              ${renderTransactionalFooter(branding)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderDetailTable(rows: Array<{ label: string; value: string }>): string {
  const items = rows
    .map(
      (row) => `<tr>
        <td class="email-detail-label" style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;width:42%;vertical-align:top;">${escapeHtml(row.label)}</td>
        <td class="email-detail-value" style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;font-weight:600;vertical-align:top;">${row.value}</td>
      </tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">${items}</table>`;
}
