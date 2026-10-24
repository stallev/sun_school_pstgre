const ISO_DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses `yyyy-MM-dd` into a local Date (no UTC midnight shift). */
export function parseIsoDateOnlyToLocalDate(value: string): Date | undefined {
  const trimmed = value.trim();
  const match = trimmed.match(ISO_DATE_ONLY);
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return undefined;
  }
  return date;
}

export function formatDateToIsoDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isIsoDateWithinRange(
  iso: string,
  min?: string,
  max?: string,
): boolean {
  if (min && iso < min) return false;
  if (max && iso > max) return false;
  return true;
}
