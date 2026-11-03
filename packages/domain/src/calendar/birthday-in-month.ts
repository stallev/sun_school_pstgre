const isLeapYear = (year: number): boolean =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

/** Calendar day (1–31) when birthDate falls in the given year/month, or null if month differs. */
export const birthdayDayInMonth = (
  birthDateIso: string,
  year: number,
  month: number,
): number | null => {
  const [, monthPart, dayPart] = birthDateIso.split("-");
  const birthMonth = Number(monthPart);
  const birthDay = Number(dayPart);
  if (birthMonth !== month) return null;
  if (birthMonth === 2 && birthDay === 29 && !isLeapYear(year)) {
    return 28;
  }
  return birthDay;
};

export const birthdayEventDateIso = (
  birthDateIso: string,
  year: number,
  month: number,
): string | null => {
  const day = birthdayDayInMonth(birthDateIso, year, month);
  if (day === null) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};
