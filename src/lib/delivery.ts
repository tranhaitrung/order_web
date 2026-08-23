import { DeliverySlotId } from "@/lib/menu-data";

const VN_TIMEZONE = "Asia/Ho_Chi_Minh";
const VN_UTC_OFFSET_HOURS = 7;
const DATE_OPTIONS_COUNT = 7;

/** Slot cutoff = its start time. Same day, after this time, the slot can no longer be booked. */
export const DELIVERY_SLOT_START: Record<DeliverySlotId, { hour: number; minute: number }> = {
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

/**
 * Converts Vietnam wall-clock components to the real UTC instant they represent.
 * Vietnam has no DST, so the offset is a constant +7h.
 */
function vnWallTimeToUtc(year: number, month: number, day: number, hour: number, minute: number): Date {
  return new Date(Date.UTC(year, month, day, hour - VN_UTC_OFFSET_HOURS, minute));
}

export type ClosedScope = "shift" | "day" | "permanent" | "range";

/**
 * When a "close orders for this shift/day" action should automatically lift.
 * `referenceNow` must come from `nowInVietnam()` (local getters = VN time) — never a real Date.
 * Returns null for "permanent" (no auto reopen). "range" has an admin-provided end instead — see
 * `parseVnDateTimeLocal`, not this function.
 */
export function computeClosedUntil(
  scope: Exclude<ClosedScope, "range">,
  referenceNow: Date = nowInVietnam(),
): Date | null {
  if (scope === "permanent") return null;

  if (scope === "day") {
    return vnWallTimeToUtc(referenceNow.getFullYear(), referenceNow.getMonth(), referenceNow.getDate() + 1, 0, 0);
  }

  const afternoon = DELIVERY_SLOT_START.afternoon;
  const morning = DELIVERY_SLOT_START.morning;
  const isBeforeAfternoonShift =
    referenceNow.getHours() < afternoon.hour ||
    (referenceNow.getHours() === afternoon.hour && referenceNow.getMinutes() < afternoon.minute);

  if (isBeforeAfternoonShift) {
    return vnWallTimeToUtc(
      referenceNow.getFullYear(),
      referenceNow.getMonth(),
      referenceNow.getDate(),
      afternoon.hour,
      afternoon.minute,
    );
  }

  return vnWallTimeToUtc(
    referenceNow.getFullYear(),
    referenceNow.getMonth(),
    referenceNow.getDate() + 1,
    morning.hour,
    morning.minute,
  );
}

const DATETIME_LOCAL_REGEX = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/** Parses a `<input type="datetime-local">` value (e.g. "2026-01-01T00:00") as Vietnam wall-clock time. */
export function parseVnDateTimeLocal(value: string): Date | null {
  const match = DATETIME_LOCAL_REGEX.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  return vnWallTimeToUtc(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
}
