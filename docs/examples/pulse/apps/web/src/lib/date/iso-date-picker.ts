import { format } from "date-fns";

const ISO_DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parses a calendar date string `yyyy-MM-dd` into a local Date (no UTC midnight shift).
 */
export function parseIsoDateOnlyToLocalDate(value: string): Date | undefined {
  const trimmed = value.trim();
  const m = trimmed.match(ISO_DATE_ONLY);
  if (!m) return undefined;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return undefined;
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) {
    return undefined;
  }
  return date;
}

export function formatDateToIsoDateOnly(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function getDatePickerProps(iso: string | undefined): {
  selectedDate: Date | undefined;
  defaultMonth: Date;
} {
  const selectedDate = iso ? parseIsoDateOnlyToLocalDate(iso) : undefined;
  return {
    selectedDate,
    defaultMonth: selectedDate ?? new Date(),
  };
}
