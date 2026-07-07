import type { ReportDatePreset, ReportDateRange } from "@/features/admin/reports/types/reports.types";
import { addDaysToIsoDate, getTodayIso } from "@/features/booking/utils/time";

function startOfMonthIso(date: Date): string {
  return getTodayIso(new Date(date.getFullYear(), date.getMonth(), 1));
}

function endOfMonthIso(date: Date): string {
  return getTodayIso(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

export function resolveReportDateRange(
  preset: ReportDatePreset = "last_7_days",
  customFrom?: string,
  customTo?: string,
  now = new Date(),
): ReportDateRange {
  const today = getTodayIso(now);

  switch (preset) {
    case "today":
      return { preset, from: today, to: today, label: "Today" };
    case "yesterday": {
      const yesterday = addDaysToIsoDate(today, -1);
      return { preset, from: yesterday, to: yesterday, label: "Yesterday" };
    }
    case "last_7_days":
      return {
        preset,
        from: addDaysToIsoDate(today, -6),
        to: today,
        label: "Last 7 Days",
      };
    case "last_15_days":
      return {
        preset,
        from: addDaysToIsoDate(today, -14),
        to: today,
        label: "Last 15 Days",
      };
    case "last_30_days":
      return {
        preset,
        from: addDaysToIsoDate(today, -29),
        to: today,
        label: "Last 30 Days",
      };
    case "this_month":
      return {
        preset,
        from: startOfMonthIso(now),
        to: today,
        label: "This Month",
      };
    case "previous_month": {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return {
        preset,
        from: startOfMonthIso(prev),
        to: endOfMonthIso(prev),
        label: "Previous Month",
      };
    }
    case "custom":
      return {
        preset,
        from: customFrom ?? today,
        to: customTo ?? customFrom ?? today,
        label: "Custom Range",
      };
    default:
      return resolveReportDateRange("last_7_days", customFrom, customTo, now);
  }
}

export function enumerateIsoDates(from: string, to: string): string[] {
  const dates: string[] = [];
  let cursor = from;
  while (cursor <= to) {
    dates.push(cursor);
    cursor = addDaysToIsoDate(cursor, 1);
  }
  return dates;
}

export function parseReportQuery(searchParams: URLSearchParams) {
  const preset = (searchParams.get("preset") as ReportDatePreset) ?? "last_7_days";
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  return resolveReportDateRange(preset, from, to);
}
