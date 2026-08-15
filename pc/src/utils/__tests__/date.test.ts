import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatLocalDate, getToday, getDaysAgo, getDaysLater, getCurrentHour, isToday, isWithinDays } from '../date';

describe('date utilities', () => {
  beforeEach(() => {
    // 固定时间为 2026-06-13 14:30:00
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 13, 14, 30, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatLocalDate', () => {
    it('should format date as YYYY-MM-DD', () => {
      const d = new Date(2026, 0, 5); // 2026-01-05
      expect(formatLocalDate(d)).toBe('2026-01-05');
    });

    it('should pad single-digit months and days', () => {
      const d = new Date(2026, 2, 9); // 2026-03-09
      expect(formatLocalDate(d)).toBe('2026-03-09');
    });
  });

  describe('getToday', () => {
    it('should return today in local time', () => {
      expect(getToday()).toBe('2026-06-13');
    });
  });

  describe('getDaysAgo', () => {
    it('should return yesterday', () => {
      expect(getDaysAgo(1)).toBe('2026-06-12');
    });

    it('should return 7 days ago', () => {
      expect(getDaysAgo(7)).toBe('2026-06-06');
    });

    it('should handle month boundary', () => {
      expect(getDaysAgo(14)).toBe('2026-05-30');
    });
  });

  describe('getDaysLater', () => {
    it('should return tomorrow', () => {
      expect(getDaysLater(1)).toBe('2026-06-14');
    });

    it('should return 7 days later', () => {
      expect(getDaysLater(7)).toBe('2026-06-20');
    });
  });

  describe('getCurrentHour', () => {
    it('should return current hour (0-23)', () => {
      expect(getCurrentHour()).toBe(14);
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      expect(isToday('2026-06-13')).toBe(true);
    });

    it('should return false for other dates', () => {
      expect(isToday('2026-06-12')).toBe(false);
    });
  });

  describe('isWithinDays', () => {
    it('should return true for date within range', () => {
      expect(isWithinDays('2026-06-10', 7)).toBe(true);
    });

    it('should return false for date outside range', () => {
      expect(isWithinDays('2026-06-01', 7)).toBe(false);
    });
  });
});
