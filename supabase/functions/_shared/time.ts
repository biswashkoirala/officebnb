// Booking time rules: every date/time on the platform is Sydney wall-clock
// time (the listings are all in NSW), regardless of where the server or the
// renter's browser happens to be. Pure TypeScript, shared by the Edge
// Functions and the React app — see pricing.ts for why.

export const TIME_ZONE = 'Australia/Sydney';

/** Earliest a booking may start, measured from now. */
export const MIN_LEAD_MINUTES = 60;
/** How far ahead bookings can be made. */
export const MAX_ADVANCE_DAYS = 365;
export const MIN_BOOKING_HOURS = 1;
export const MAX_BOOKING_HOURS = 16;

/** Renters get a full refund if they cancel at least this long before start. */
export const FREE_CANCELLATION_HOURS = 48;

/** How long an unpaid checkout holds its slot before someone else can take it. */
export const HOLD_MINUTES = 15;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** Bookings are on the half hour: 06:00, 06:30 … 23:30. */
const SLOT_RE = /^([01]\d|2[0-3]):(00|30)$/;

function partsInZone(ms: number, timeZone: string) {
  const fmt = new Intl.DateTimeFormat('en-AU', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const out: Record<string, number> = {};
  for (const p of fmt.formatToParts(new Date(ms))) {
    if (p.type !== 'literal') out[p.type] = Number(p.value);
  }
  return out as { year: number; month: number; day: number; hour: number; minute: number; second: number };
}

/** Offset of `timeZone` from UTC at instant `ms`, in milliseconds. */
function zoneOffsetMs(ms: number, timeZone: string): number {
  const p = partsInZone(ms, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(ms / 1000) * 1000;
}

/** Converts a Sydney wall-clock date + "HH:MM" into a UTC instant. */
export function sydneyToUtc(date: string, time: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  // Two passes handles instants close to a daylight-saving switch.
  let utc = guess - zoneOffsetMs(guess, TIME_ZONE);
  utc = guess - zoneOffsetMs(utc, TIME_ZONE);
  return new Date(utc);
}

/** Today's date in Sydney as YYYY-MM-DD. */
export function todayInSydney(nowMs: number = Date.now()): string {
  const p = partsInZone(nowMs, TIME_ZONE);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

function isRealDate(date: string): boolean {
  if (!DATE_RE.test(date)) return false;
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export interface BookingTimeInput {
  date: string;
  startTime: string;
  endTime: string;
}

export type BookingTimeCheck =
  | { ok: true; startsAt: Date; hours: number }
  | { ok: false; error: string };

/** Validates when a booking is for. Returns a friendly error if not bookable. */
export function checkBookingTime(input: BookingTimeInput, nowMs: number = Date.now()): BookingTimeCheck {
  const { date, startTime, endTime } = input;
  if (typeof date !== 'string' || !isRealDate(date)) return { ok: false, error: 'Please choose a valid date.' };
  if (typeof startTime !== 'string' || typeof endTime !== 'string' || !SLOT_RE.test(startTime) || !SLOT_RE.test(endTime)) {
    return { ok: false, error: 'Bookings start and end on the hour or half hour.' };
  }
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const hours = (eh * 60 + em - (sh * 60 + sm)) / 60;
  if (hours <= 0) return { ok: false, error: 'End time must be after start time.' };
  if (hours < MIN_BOOKING_HOURS) return { ok: false, error: `The minimum booking is ${MIN_BOOKING_HOURS} hour.` };
  if (hours > MAX_BOOKING_HOURS) return { ok: false, error: `The maximum booking is ${MAX_BOOKING_HOURS} hours.` };

  const startsAt = sydneyToUtc(date, startTime);
  if (startsAt.getTime() < nowMs + MIN_LEAD_MINUTES * 60_000) {
    return { ok: false, error: `Bookings must start at least ${MIN_LEAD_MINUTES} minutes from now.` };
  }
  if (startsAt.getTime() > nowMs + MAX_ADVANCE_DAYS * 86_400_000) {
    return { ok: false, error: `Bookings can be made up to ${MAX_ADVANCE_DAYS} days ahead.` };
  }
  return { ok: true, startsAt, hours };
}

/** Hours from now until a booking starts (negative once it has started). */
export function hoursUntil(startsAt: Date | string, nowMs: number = Date.now()): number {
  return (new Date(startsAt).getTime() - nowMs) / 3_600_000;
}

/**
 * How much a renter gets back if they cancel now: everything if it's at
 * least FREE_CANCELLATION_HOURS away, nothing after that. An owner
 * cancelling always refunds the renter in full (handled by the caller).
 */
export function renterRefundAmount(total: number, startsAt: Date | string, nowMs: number = Date.now()): number {
  return hoursUntil(startsAt, nowMs) >= FREE_CANCELLATION_HOURS ? total : 0;
}
