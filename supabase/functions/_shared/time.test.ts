import { describe, expect, it } from 'vitest';
import { checkBookingTime, renterRefundAmount, sydneyToUtc, todayInSydney } from './time';

describe('sydneyToUtc', () => {
  it('handles AEST (UTC+10) in winter', () => {
    expect(sydneyToUtc('2026-07-01', '18:00').toISOString()).toBe('2026-07-01T08:00:00.000Z');
  });
  it('handles AEDT (UTC+11) in summer', () => {
    expect(sydneyToUtc('2026-12-01', '18:00').toISOString()).toBe('2026-12-01T07:00:00.000Z');
  });
  it('handles the days either side of the October DST switch', () => {
    // DST starts 2am Sunday 4 Oct 2026
    expect(sydneyToUtc('2026-10-03', '18:00').toISOString()).toBe('2026-10-03T08:00:00.000Z');
    expect(sydneyToUtc('2026-10-04', '18:00').toISOString()).toBe('2026-10-04T07:00:00.000Z');
  });
});

describe('todayInSydney', () => {
  it('uses Sydney date, not UTC date', () => {
    // 20:00 UTC on 1 Jul is 6am on 2 Jul in Sydney
    expect(todayInSydney(Date.UTC(2026, 6, 1, 20, 0))).toBe('2026-07-02');
  });
});

describe('checkBookingTime', () => {
  const now = Date.UTC(2026, 6, 1, 0, 0); // 10am 1 Jul Sydney

  it('accepts a normal evening booking', () => {
    const r = checkBookingTime({ date: '2026-07-02', startTime: '18:00', endTime: '21:00' }, now);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.hours).toBe(3);
  });

  it('rejects dates in the past', () => {
    const r = checkBookingTime({ date: '2026-06-30', startTime: '18:00', endTime: '21:00' }, now);
    expect(r.ok).toBe(false);
  });

  it('rejects a start less than the lead time away', () => {
    // 10:30 same day is only 30 minutes from now
    const r = checkBookingTime({ date: '2026-07-01', startTime: '10:30', endTime: '12:00' }, now);
    expect(r.ok).toBe(false);
  });

  it('rejects malformed input', () => {
    expect(checkBookingTime({ date: '2026-02-30', startTime: '18:00', endTime: '21:00' }, now).ok).toBe(false);
    expect(checkBookingTime({ date: '2026-07-02', startTime: '18:15', endTime: '21:00' }, now).ok).toBe(false);
    expect(checkBookingTime({ date: '2026-07-02', startTime: '21:00', endTime: '18:00' }, now).ok).toBe(false);
    expect(checkBookingTime({ date: '2026-07-02', startTime: '18:00', endTime: '18:30' }, now).ok).toBe(false);
  });

  it('rejects bookings more than a year out', () => {
    expect(checkBookingTime({ date: '2027-08-01', startTime: '18:00', endTime: '21:00' }, now).ok).toBe(false);
  });
});

describe('renterRefundAmount', () => {
  const startsAt = new Date(Date.UTC(2026, 6, 10, 8, 0));
  it('refunds in full 48h or more ahead', () => {
    expect(renterRefundAmount(82.5, startsAt, startsAt.getTime() - 48 * 3_600_000)).toBe(82.5);
  });
  it('refunds nothing inside 48h', () => {
    expect(renterRefundAmount(82.5, startsAt, startsAt.getTime() - 47 * 3_600_000)).toBe(0);
  });
});
