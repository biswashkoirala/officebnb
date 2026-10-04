// Pricing and time rules come from the same files the payment server uses,
// so the price and rules shown here always match what is charged.
export {
  CURRENCY,
  SERVICE_FEE_RATE,
  HOST_COMMISSION_RATE,
  hoursBetween,
  priceBreakdown,
  isWithinAvailableHours,
} from '../../supabase/functions/_shared/pricing.ts';
export {
  TIME_ZONE,
  FREE_CANCELLATION_HOURS,
  HOLD_MINUTES,
  MIN_LEAD_MINUTES,
  checkBookingTime,
  hoursUntil,
  renterRefundAmount,
  sydneyToUtc,
  todayInSydney,
} from '../../supabase/functions/_shared/time.ts';

export function formatTime(time: string): string {
  const [hStr, mStr] = time.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr ?? '00';
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${period}`;
}

export function formatCurrency(value: number): string {
  const hasCents = Math.round(value * 100) % 100 !== 0;
  return value.toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

/** "2026-10-03" → "Sat 3 Oct 2026" (the date is a calendar date, no timezone maths). */
export function formatDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-AU', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Half-hour slots offered for booking: 6:00 AM … 11:30 PM. */
export const TIME_SLOTS = Array.from({ length: 36 }, (_, i) => {
  const totalMinutes = 6 * 60 + i * 30;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  return { value, label: formatTime(value) };
});
