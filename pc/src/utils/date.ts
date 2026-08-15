/**
 * Shared date utilities to eliminate repeated date calculations
 */

/** Format a Date as local YYYY-MM-DD */
export function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Get today's date string (YYYY-MM-DD) */
export function getToday(): string {
  return formatLocalDate(new Date());
}

/** Get date string N days ago (YYYY-MM-DD) */
export function getDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return formatLocalDate(d);
}

/** Get date string N days from now (YYYY-MM-DD) */
export function getDaysLater(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
}

/** Get current hour (0-23) */
export function getCurrentHour(): number {
  return new Date().getHours();
}

/** Get current ISO timestamp */
export function getNow(): string {
  return new Date().toISOString();
}

/** Check if a date string is today */
export function isToday(dateStr: string): boolean {
  return dateStr === getToday();
}

/** Check if a date string is within the last N days */
export function isWithinDays(dateStr: string, days: number): boolean {
  return dateStr >= getDaysAgo(days);
}
