import {
  formatUtcTime,
  formatUtcDate,
  shiftUtcDays,
  getTodayUtcDate,
} from './dateTime';

describe('dateTime utilities', () => {
  describe('formatUtcTime', () => {
    it('formats UTC time correctly for morning hours', () => {
      expect(formatUtcTime('2026-09-21T09:30:00Z')).toBe('9:30 AM');
    });

    it('formats UTC time correctly for noon', () => {
      expect(formatUtcTime('2026-09-21T12:00:00Z')).toBe('12:00 PM');
    });

    it('formats UTC time correctly for evening hours', () => {
      expect(formatUtcTime('2026-09-21T21:05:00Z')).toBe('9:05 PM');
    });

    it('formats midnight as 12:00 AM', () => {
      expect(formatUtcTime('2026-09-21T00:00:00Z')).toBe('12:00 AM');
    });

    it('returns empty string for invalid date', () => {
      expect(formatUtcTime('invalid-date')).toBe('');
    });

    it('accepts Date objects', () => {
      const d = new Date(Date.UTC(2026, 8, 21, 14, 15));
      expect(formatUtcTime(d)).toBe('2:15 PM');
    });
  });

  describe('formatUtcDate', () => {
    it('formats UTC date correctly', () => {
      expect(formatUtcDate('2026-09-21T10:00:00Z')).toBe('Mon, Sep 21 2026');
    });

    it('returns empty string for invalid date', () => {
      expect(formatUtcDate('invalid-date')).toBe('');
    });
  });

  describe('shiftUtcDays', () => {
    it('shifts forward by positive days', () => {
      expect(shiftUtcDays('2026-09-21', 1)).toBe('2026-09-22');
      expect(shiftUtcDays('2026-09-30', 1)).toBe('2026-10-01');
    });

    it('shifts backward by negative days', () => {
      expect(shiftUtcDays('2026-09-21', -1)).toBe('2026-09-20');
      expect(shiftUtcDays('2026-10-01', -1)).toBe('2026-09-30');
    });
  });

  describe('getTodayUtcDate', () => {
    it('returns YYYY-MM-DD pattern', () => {
      const today = getTodayUtcDate();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
