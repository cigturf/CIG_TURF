const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "/": "&#x2F;",
};

const SCRIPT_TAG_PATTERN = /<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi;
const EVENT_HANDLER_PATTERN = /\son\w+\s*=\s*(['"]).*?\1/gi;
const JAVASCRIPT_URL_PATTERN = /javascript:/gi;

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"'/]/g, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

/** Strip script tags and inline handlers from rich text fields. */
export function sanitizeRichText(value: string | null | undefined): string | null {
  if (!value) return null;
  const stripped = value
    .replace(SCRIPT_TAG_PATTERN, "")
    .replace(EVENT_HANDLER_PATTERN, "")
    .replace(JAVASCRIPT_URL_PATTERN, "");
  return stripped.trim() || null;
}

export function sanitizePlainText(value: string | null | undefined, maxLength = 500): string | null {
  if (!value) return null;
  const normalized = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  if (!normalized) return null;
  return normalized.slice(0, maxLength);
}

export function sanitizeDisplayName(value: string): string {
  return escapeHtml(sanitizePlainText(value, 120) ?? "");
}
