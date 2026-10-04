// Pricing rules — the single source of truth for what a booking costs.
//
// This file is pure TypeScript with no Deno- or browser-specific APIs, so
// it's imported both by the Edge Functions (which decide what is actually
// charged) and by the React app via src/lib/utils.ts (which only renders a
// preview). There is nothing to keep in sync.

/** Currency every price on the platform is in. Stripe wants it lowercase. */
export const CURRENCY = 'aud';

/** Fee the renter pays on top of the hourly price; kept by the platform. */
export const SERVICE_FEE_RATE = 0.1;

/**
 * Commission taken out of the owner's share (on top of the renter's service
 * fee). 0 means owners receive 100% of the hourly price. Change with care:
 * it must match what your Terms promise owners.
 */
export const HOST_COMMISSION_RATE = 0;

const round2 = (n: number) => Math.round(n * 100) / 100;

export function hoursBetween(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  const diff = (endMinutes - startMinutes) / 60;
  return diff > 0 ? diff : 0;
}

export function priceBreakdown(pricePerHour: number, hours: number) {
  const subtotal = round2(pricePerHour * hours);
  const serviceFee = round2(subtotal * SERVICE_FEE_RATE);
  const total = round2(subtotal + serviceFee);
  const hostCommission = round2(subtotal * HOST_COMMISSION_RATE);
  const hostPayout = round2(subtotal - hostCommission);
  /** Everything the platform keeps (before Stripe's own processing fee). */
  const platformFee = round2(total - hostPayout);
  return { subtotal, serviceFee, total, hostPayout, platformFee };
}

/** Dollars → integer cents, as Stripe expects. */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export interface AvailableHours {
  weekdays: { start: string; end: string };
  weekends: { start: string; end: string };
}

export function isWithinAvailableHours(
  availableHours: AvailableHours,
  dateStr: string,
  startTime: string,
  endTime: string,
): boolean {
  const [y, m, d] = dateStr.split('-').map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const isWeekend = day === 0 || day === 6;
  const window = isWeekend ? availableHours.weekends : availableHours.weekdays;
  return startTime >= window.start && endTime <= window.end;
}
