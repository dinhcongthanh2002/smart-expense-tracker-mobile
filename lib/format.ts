import dayjs from "dayjs";
import "dayjs/locale/vi";

dayjs.locale("vi");

export function formatCurrency(amount = 0, currency = "VND"): string {
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "VND" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${Math.round(amount).toLocaleString("vi-VN")} ${currency}`;
  }
}

/** Compact currency for chart labels / tight spaces (e.g. 1.2M). */
export function formatCompact(amount = 0): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return String(Math.round(amount));
}

export function formatDate(value?: string | Date, pattern = "DD/MM/YYYY"): string {
  if (!value) return "";
  return dayjs(value).format(pattern);
}

export function formatDateTime(value?: string | Date): string {
  return formatDate(value, "DD/MM/YYYY HH:mm");
}

export const startOfMonthISO = () =>
  dayjs().startOf("month").format("YYYY-MM-DDTHH:mm:ss");
export const endOfMonthISO = () =>
  dayjs().endOf("month").format("YYYY-MM-DDTHH:mm:ss");
