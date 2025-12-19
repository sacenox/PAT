/**
 * Formats a date or date string into a localized string representation.
 * @param date - The date to format (Date object or ISO string)
 * @returns Formatted date string
 */
export function formatTimestamp(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString();
}
