// apps/api/src/utils/__tests__/date.test.ts
// Pure function tests - no mocking required

import { describe, it, expect } from '@jest/globals';
import {
  getTodayLocal,
  normalizeDate,
  formatDate,
  getDateOffset,
  isToday,
  isPast,
  isFuture,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
} from '../date.js';

describe('date utilities', () => {
  describe('getTodayLocal', () => {
    it('returns date in YYYY-MM-DD format', () => {
      const today = getTodayLocal();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('returns current date', () => {
      const today = getTodayLocal();
      const now = new Date();
      const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      expect(today).toBe(expected);
    });
  });

  describe('normalizeDate', () => {
    it('extracts date from datetime string', () => {
      expect(normalizeDate('2024-01-15T10:30:00Z')).toBe('2024-01-15');
      expect(normalizeDate('2024-12-31T23:59:59.999Z')).toBe('2024-12-31');
    });

    it('handles date-only strings', () => {
      expect(normalizeDate('2024-01-15')).toBe('2024-01-15');
    });

    it('returns empty string for empty input', () => {
      expect(normalizeDate('')).toBe('');
    });
  });

  describe('formatDate', () => {
    it('formats date for display', () => {
      // Use Date constructor with year, month, day to avoid timezone issues
      // Month is 0-indexed, so 0 = January
      const date = new Date(2024, 0, 15); // Jan 15, 2024 in local time
      const formatted = formatDate(date);
      expect(formatted).toContain('2024');
      expect(formatted).toContain('15');
    });

    it('handles Date objects', () => {
      const date = new Date(2024, 5, 20); // June 20, 2024 in local time
      const formatted = formatDate(date);
      expect(formatted).toContain('2024');
      expect(formatted).toContain('20');
    });
  });

  describe('getDateOffset', () => {
    it('returns future date for positive offset', () => {
      const today = getTodayLocal();
      const tomorrow = getDateOffset(1);
      expect(tomorrow).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(tomorrow > today).toBe(true);
    });

    it('returns past date for negative offset', () => {
      const today = getTodayLocal();
      const yesterday = getDateOffset(-1);
      expect(yesterday < today).toBe(true);
    });

    it('returns today for zero offset', () => {
      const today = getTodayLocal();
      expect(getDateOffset(0)).toBe(today);
    });
  });

  describe('isToday', () => {
    it('returns true for today', () => {
      const today = getTodayLocal();
      expect(isToday(today)).toBe(true);
    });

    it('returns false for past dates', () => {
      expect(isToday('2020-01-01')).toBe(false);
    });

    it('returns false for future dates', () => {
      expect(isToday(getDateOffset(1))).toBe(false);
    });
  });

  describe('isPast', () => {
    it('returns true for past dates', () => {
      expect(isPast('2020-01-01')).toBe(true);
      expect(isPast(getDateOffset(-1))).toBe(true);
    });

    it('returns false for today', () => {
      expect(isPast(getTodayLocal())).toBe(false);
    });

    it('returns false for future dates', () => {
      expect(isPast(getDateOffset(1))).toBe(false);
    });
  });

  describe('isFuture', () => {
    it('returns true for future dates', () => {
      expect(isFuture(getDateOffset(1))).toBe(true);
      expect(isFuture('2099-12-31')).toBe(true);
    });

    it('returns false for today', () => {
      expect(isFuture(getTodayLocal())).toBe(false);
    });

    it('returns false for past dates', () => {
      expect(isFuture('2020-01-01')).toBe(false);
    });
  });

  describe('startOfDay', () => {
    it('sets time to 00:00:00.000', () => {
      const start = startOfDay(new Date(2024, 0, 15, 15, 30, 45, 123));
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);
      expect(start.getMilliseconds()).toBe(0);
    });

    it('defaults to today', () => {
      const start = startOfDay();
      const now = new Date();
      expect(start.getDate()).toBe(now.getDate());
    });
  });

  describe('endOfDay', () => {
    it('sets time to 23:59:59.999', () => {
      const end = endOfDay(new Date(2024, 0, 15, 10, 0, 0));
      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
      expect(end.getSeconds()).toBe(59);
      expect(end.getMilliseconds()).toBe(999);
    });
  });

  describe('startOfWeek', () => {
    it('returns Sunday of the week', () => {
      // Wednesday Jan 17, 2024
      const wednesday = new Date(2024, 0, 17, 12, 0, 0);
      const start = startOfWeek(wednesday);
      expect(start.getDay()).toBe(0); // Sunday
    });

    it('returns same day if already Sunday', () => {
      const sunday = new Date(2024, 0, 14, 12, 0, 0);
      const start = startOfWeek(sunday);
      expect(start.getDay()).toBe(0);
    });
  });

  describe('endOfWeek', () => {
    it('returns Saturday of the week', () => {
      const wednesday = new Date(2024, 0, 17, 12, 0, 0);
      const end = endOfWeek(wednesday);
      expect(end.getDay()).toBe(6); // Saturday
    });
  });
});
