import { describe, expect, it } from 'vitest';
import { hoursBetween, isWithinAvailableHours, priceBreakdown } from './pricing';

const HOURS = {
  weekdays: { start: '18:00', end: '22:00' },
  weekends: { start: '09:00', end: '20:00' },
};

describe('hoursBetween / priceBreakdown (server copy)', () => {
  it('matches the frontend copy\'s behavior', () => {
    expect(hoursBetween('18:00', '21:00')).toBe(3);
    expect(priceBreakdown(25, 3)).toMatchObject({ subtotal: 75, serviceFee: 7.5, total: 82.5 });
  });
});

describe('isWithinAvailableHours', () => {
  it('accepts a weekday booking inside the weekday window', () => {
    // 2024-01-01 is a Monday
    expect(isWithinAvailableHours(HOURS, '2024-01-01', '18:00', '21:00')).toBe(true);
  });

  it('rejects a weekday booking outside the weekday window', () => {
    expect(isWithinAvailableHours(HOURS, '2024-01-01', '09:00', '10:00')).toBe(false);
  });

  it('uses the weekend window for Saturday/Sunday', () => {
    // 2024-01-06 is a Saturday
    expect(isWithinAvailableHours(HOURS, '2024-01-06', '10:00', '12:00')).toBe(true);
    expect(isWithinAvailableHours(HOURS, '2024-01-06', '21:00', '22:00')).toBe(false);
  });
});

describe('priceBreakdown split', () => {
  it('owner receives the subtotal and the platform keeps the service fee', () => {
    const b = priceBreakdown(25, 3);
    expect(b.hostPayout).toBe(75);
    expect(b.platformFee).toBe(7.5);
    expect(b.hostPayout + b.platformFee).toBe(b.total);
  });
});
