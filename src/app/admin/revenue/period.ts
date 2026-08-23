import { dateKeyToDate } from "@/lib/delivery";
import type { RevenuePeriod } from "@/lib/order-repository";

function dmy(dateKey: string): string {
  const date = dateKeyToDate(dateKey);
  if (!date) return dateKey;
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function periodLabel(period: RevenuePeriod, periodStart: string, short = false): string {
  const date = dateKeyToDate(periodStart);
  if (!date) return periodStart;

  if (period === "day") {
    return short ? dmy(periodStart) : `${dmy(periodStart)}/${date.getFullYear()}`;
  }
  if (period === "week") {
    return short ? dmy(periodStart) : `Tuần ${dmy(periodStart)}/${date.getFullYear()}`;
  }
  if (period === "month") {
    const month = date.getMonth() + 1;
    return short ? `T${month}` : `Tháng ${month}/${date.getFullYear()}`;
  }
  return String(date.getFullYear());
}

export const PERIOD_OPTIONS: { id: RevenuePeriod; label: string }[] = [
  { id: "day", label: "Ngày" },
  { id: "week", label: "Tuần" },
  { id: "month", label: "Tháng" },
  { id: "year", label: "Năm" },
];
