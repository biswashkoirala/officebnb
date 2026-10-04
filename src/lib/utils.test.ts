import { describe, expect, it } from 'vitest';
import { formatCurrency, formatDate, hoursBetween, priceBreakdown, TIME_SLOTS } from './utils';

describe('hoursBetween', () => {
  it('computes whole and fractional hours', () => {
    expect(hoursBetween('18:00', '21:00')).toBe(3);
    expect(hoursBetween('18:00', '19:30')).toBe(1.5);
  });

  it('floors a zero or negative range to 0', () => {
    expect(hoursBetween('20:00', '20:00')).toBe(0);
    expect(hoursBetween('20:00', '18:00')).toBe(0);
  });
});

describe('priceBreakdown', () => {
  it('applies the service fee rate and rounds to cents', () => {
    expect(priceBreakdown(25, 3)).toMatchObject({ subtotal: 75, serviceFee: 7.5, total: 82.5 });
  });

  it('rounds fractional cents correctly', () => {
    const { subtotal, serviceFee, total } = priceBreakdown(19.99, 1.5);
    expect(subtotal).toBeCloseTo(29.99, 2);
    expect(serviceFee).toBeCloseTo(3, 2);
    expect(total).toBeCloseTo(subtotal + serviceFee, 2);
  });

  it('is always zero for zero hours', () => {
    expect(priceBreakdown(50, 0)).toMatchObject({ subtotal: 0, serviceFee: 0, total: 0 });
  });
});

describe('formatting', () => {
  it('formats Australian dollars', () => {
    expect(formatCurrency(82.5)).toBe('$82.50');
    expect(formatCurrency(75)).toBe('$75');
  });

  it('formats a calendar date without shifting it', () => {
    expect(formatDate('2026-10-03')).toMatch(/Sat.*3.*Oct.*2026/);
  });

  it('offers half-hour slots from 6am to 11:30pm', () => {
    expect(TIME_SLOTS[0].value).toBe('06:00');
    expect(TIME_SLOTS.at(-1)!.value).toBe('23:30');
  });
});
