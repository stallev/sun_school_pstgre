import "server-only";

import type { GroupYearTotals, PupilYearTotals } from "@sunschool/domain";
import type { Prisma } from "@sunschool/db";

export const decimalToNumber = (value: Prisma.Decimal | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  return value.toNumber();
};

export const groupSnapshotRowToTotals = (row: {
  kids: number;
  lessons: number;
  attendance: Prisma.Decimal | null;
  verses: Prisma.Decimal | null;
  test: Prisma.Decimal | null;
  notebook: Prisma.Decimal | null;
}): GroupYearTotals => ({
  kids: row.kids,
  lessons: row.lessons,
  attendance: decimalToNumber(row.attendance),
  verses: decimalToNumber(row.verses),
  test: decimalToNumber(row.test),
  notebook: decimalToNumber(row.notebook),
});

export const pupilSnapshotRowToTotals = (row: {
  lessons: number;
  attendance: Prisma.Decimal | null;
  verses: Prisma.Decimal | null;
  test: Prisma.Decimal | null;
  notebook: Prisma.Decimal | null;
  bricksEarned: number;
}): PupilYearTotals => ({
  lessons: row.lessons,
  attendance: decimalToNumber(row.attendance),
  verses: decimalToNumber(row.verses),
  test: decimalToNumber(row.test),
  notebook: decimalToNumber(row.notebook),
  bricksEarned: row.bricksEarned,
});
