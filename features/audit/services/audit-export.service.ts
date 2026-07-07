import type { AuditDirectoryData } from "@/features/audit/types/audit.types";

function escapeCsv(value: string | number) {
  const text = String(value);
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildAuditCsv(data: AuditDirectoryData): string {
  const headers = [
    "Timestamp",
    "Action",
    "Category",
    "Module",
    "Performed By",
    "Entity ID",
    "Booking ID",
    "Customer",
    "Description",
    "Old Value",
    "New Value",
  ];

  const rows = data.logs.map((log) =>
    [
      log.createdAt,
      log.action,
      log.category,
      log.module,
      log.performedBy ?? "",
      log.entityId ?? "",
      log.bookingId ?? "",
      log.customerName ?? "",
      log.description,
      log.oldValue ?? "",
      log.newValue ?? "",
    ]
      .map(escapeCsv)
      .join(","),
  );

  return [headers.join(","), ...rows].join("\n");
}

export function buildAuditExcelCsv(data: AuditDirectoryData): string {
  return `\uFEFF${buildAuditCsv(data)}`;
}

export function buildAuditPdfHtml(data: AuditDirectoryData, venueName: string): string {
  const rows = data.logs
    .slice(0, 100)
    .map(
      (log) => `
      <tr>
        <td>${new Date(log.createdAt).toLocaleString("en-IN")}</td>
        <td>${log.action}</td>
        <td>${log.category}</td>
        <td>${log.performedBy ?? "—"}</td>
        <td>${log.description}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${venueName} — Audit Log</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 32px; color: #111; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
    th, td { border-bottom: 1px solid #e5e5e5; padding: 8px 6px; text-align: left; }
    th { font-size: 11px; text-transform: uppercase; color: #666; }
  </style>
</head>
<body>
  <h1>${venueName} — System Audit Log</h1>
  <p>${data.range.label} · ${data.total} entries</p>
  <table>
    <thead><tr><th>Time</th><th>Action</th><th>Category</th><th>By</th><th>Description</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}
