import { DeliverySlotId } from "@/lib/menu-data";

const VN_TIMEZONE = "Asia/Ho_Chi_Minh";
const DATE_OPTIONS_COUNT = 7;

/** Slot cutoff = its start time. Same day, after this time, the slot can no longer be booked. */
const DELIVERY_SLOT_START: Record<DeliverySlotId, { hour: number; minute: number }> = {
  morning: { hour: 8, minute: 0 },
  afternoon: { hour: 13, minute: 0 },
};

const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/**
 * Current wall-clock time in Vietnam, represented as a Date whose LOCAL
 * getters (getHours/getDate/...) return the Vietnam values — regardless of
 * the runtime's actual system timezone (e.g. a UTC serverless function).
 * Only ever compare/construct dates through local getters/constructors
 * (never toISOString/UTC) to keep this consistent end to end.
 */
export function nowInVietnam(): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: VN_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");
  return new Date(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dateKeyToDate(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function formatDayMonth(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export interface DeliveryDateOption {
  dateKey: string;
  primary: string;
  secondary: string;
  hasAvailableSlot: boolean;
}

export function buildDeliveryDateOptions(referenceNow: Date = nowInVietnam()): DeliveryDateOption[] {
  const today = dateKeyToDate(toDateKey(referenceNow))!;

  return Array.from({ length: DATE_OPTIONS_COUNT }, (_, offset) => {
    const date = new Date(today);
    date.setDate(date.getDate() + offset);
    const dateKey = toDateKey(date);
    const primary = offset === 0 ? "Hôm nay" : offset === 1 ? "Ngày mai" : WEEKDAY_LABELS[date.getDay()];

    return {
      dateKey,
      primary,
      secondary: formatDayMonth(date),
      hasAvailableSlot: firstAvailableSlotForDate(dateKey, referenceNow) !== null,
    };
  });
}

export function isDeliverySlotAvailable(
  dateKey: string,
  slot: DeliverySlotId,
  referenceNow: Date = nowInVietnam(),
): boolean {
  const date = dateKeyToDate(dateKey);
  if (!date) return false;

  const todayKey = toDateKey(referenceNow);
  if (dateKey < todayKey) return false;
  if (dateKey > todayKey) return true;

  const window = DELIVERY_SLOT_START[slot];
  const slotStart = new Date(date);
  slotStart.setHours(window.hour, window.minute, 0, 0);
  return referenceNow < slotStart;
}

export function firstAvailableSlotForDate(
  dateKey: string,
  referenceNow: Date = nowInVietnam(),
): DeliverySlotId | null {
  const slots: DeliverySlotId[] = ["morning", "afternoon"];
  return slots.find((slot) => isDeliverySlotAvailable(dateKey, slot, referenceNow)) ?? null;
}

export function pickDefaultDelivery(referenceNow: Date = nowInVietnam()): {
  dateKey: string;
  slot: DeliverySlotId;
} {
  for (const option of buildDeliveryDateOptions(referenceNow)) {
    const slot = firstAvailableSlotForDate(option.dateKey, referenceNow);
    if (slot) return { dateKey: option.dateKey, slot };
  }
  const fallback = toDateKey(referenceNow);
  return { dateKey: fallback, slot: "morning" };
}

export function formatDeliveryDateForMessage(dateKey: string, referenceNow: Date = nowInVietnam()): string {
  const date = dateKeyToDate(dateKey);
  if (!date) return dateKey;

  const todayKey = toDateKey(referenceNow);
  const tomorrow = new Date(referenceNow);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = toDateKey(tomorrow);

  const dmy = `${formatDayMonth(date)}/${date.getFullYear()}`;
  if (dateKey === todayKey) return `Hôm nay (${dmy})`;
  if (dateKey === tomorrowKey) return `Ngày mai (${dmy})`;
  return `${WEEKDAY_LABELS[date.getDay()]}, ${dmy}`;
}
