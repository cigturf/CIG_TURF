import { escapeHtml } from "@/features/communication/lib/escape-html";
import type { EmailBrandingContext } from "@/features/communication/types/email.types";

export type EmailLayoutOptions = {
  branding: EmailBrandingContext;
  previewText?: string;
  title: string;
  bodyHtml: string;
  cta?: { label: string; href: string } | null;
};

function socialLinks(branding: EmailBrandingContext): string {
  const links: string[] = [];
  if (branding.socialInstagram) {
    links.push(
      `<a href="${escapeHtml(branding.socialInstagram)}" style="color:#64748b;text-decoration:none;margin:0 8px;">Instagram</a>`,
    );
  }
  if (branding.socialFacebook) {
    links.push(
      `<a href="${escapeHtml(branding.socialFacebook)}" style="color:#64748b;text-decoration:none;margin:0 8px;">Facebook</a>`,
    );
  }
  if (branding.websiteUrl) {
    links.push(
      `<a href="${escapeHtml(branding.websiteUrl)}" style="color:#64748b;text-decoration:none;margin:0 8px;">Website</a>`,
    );
  }
  return links.join("");
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

  const footerLines = [
    branding.address ? escapeHtml(branding.address) : null,
    branding.phone ? `Phone: ${escapeHtml(branding.phone)}` : null,
    branding.supportEmail ? `Support: <a href="mailto:${escapeHtml(branding.supportEmail)}" style="color:${accent};">${escapeHtml(branding.supportEmail)}</a>` : null,
  ].filter(Boolean);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(title)}</title>
  ${previewText ? `<meta name="x-preview-text" content="${escapeHtml(previewText)}" />` : ""}
  <style>
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; padding: 16px !important; }
      .email-card { padding: 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(previewText ?? title)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;">
          <tr>
            <td class="email-card" style="background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
              ${logoHeader}
              <h1 style="margin:0 0 20px;font-size:24px;line-height:1.3;text-align:center;color:#0f172a;">${escapeHtml(title)}</h1>
              ${bodyHtml}
              ${ctaBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 8px 8px;text-align:center;font-size:12px;line-height:1.6;color:#64748b;">
              <div style="margin-bottom:8px;font-weight:600;color:#334155;">${escapeHtml(branding.businessName)}</div>
              ${footerLines.map((line) => `<div>${line}</div>`).join("")}
              <div style="margin-top:12px;">${socialLinks(branding)}</div>
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
        <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;width:42%;vertical-align:top;">${escapeHtml(row.label)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;font-weight:600;vertical-align:top;">${escapeHtml(row.value)}</td>
      </tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">${items}</table>`;
}
