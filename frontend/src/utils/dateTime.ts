/**
 * Utilities for consistent UTC datetime handling across schedule, booking,
 * and viewer components. Prevents timezone shifts between form input and display.
 */

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Formats a date/ISO string to "10:00 AM" in UTC.
 */
export function formatUtcTime(dateOrIso: string | Date): string {
  const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
  if (isNaN(d.getTime())) return '';

  const hours = d.getUTCHours();
  const minutes = d.getUTCMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');

  return `${displayHours}:${displayMinutes} ${period}`;
}

/**
 * Formats a date/ISO string to "Sun, Sep 20 2026" in UTC.
 */
export function formatUtcDate(dateOrIso: string | Date): string {
  const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
  if (isNaN(d.getTime())) return '';

  const dayName = DAYS[d.getUTCDay()];
  const monthName = MONTHS[d.getUTCMonth()];
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();

  return `${dayName}, ${monthName} ${day} ${year}`;
}

/**
 * Shifts a "YYYY-MM-DD" date string by N days in UTC without timezone drift.
 */
export function shiftUtcDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1, d + days));
  return target.toISOString().split('T')[0];
}

/**
 * Returns current UTC date as "YYYY-MM-DD".
 */
export function getTodayUtcDate(): string {
  return new Date().toISOString().split('T')[0];
}
