import { describe, expect, it, vi } from "vitest";
import { loadCalendarBirthdays } from "./calendar-birthdays.server";

const gradeId = "55555555-5555-4555-8555-555555555555";
const yearId = "66666666-6666-4666-8666-666666666666";

function mockDb(rows: Array<{ pupil: Record<string, unknown> }>) {
  return {
    enrollment: {
      findMany: vi.fn().mockResolvedValue(rows),
    },
  };
}

describe("loadCalendarBirthdays", () => {
  it("returns an empty list for parent without querying enrollments", async () => {
    const db = mockDb([]);
    const result = await loadCalendarBirthdays(
      db as never,
      gradeId,
      yearId,
      "2026-03",
      true,
    );
    expect(result).toEqual([]);
    expect(db.enrollment.findMany).not.toHaveBeenCalled();
  });

  it("maps enrolled pupils with birth dates for teacher", async () => {
    const db = mockDb([
      {
        pupil: {
          id: "p1",
          firstName: "Иван",
          lastName: "Иванов",
          middleName: null,
          birthDate: new Date("2015-03-20T00:00:00.000Z"),
        },
      },
    ]);
    const result = await loadCalendarBirthdays(
      db as never,
      gradeId,
      yearId,
      "2026-03",
      false,
    );
    expect(result).toEqual([
      {
        pupilId: "p1",
        dayOfMonth: 20,
        eventDateIso: "2026-03-20",
        displayName: "Иванов Иван",
      },
    ]);
  });

  it("shows february 29 on the 28th in a non-leap year", async () => {
    const db = mockDb([
      {
        pupil: {
          id: "p-leap",
          firstName: "Май",
          lastName: "Лис",
          middleName: null,
          birthDate: new Date("2012-02-29T00:00:00.000Z"),
        },
      },
    ]);
    const result = await loadCalendarBirthdays(
      db as never,
      gradeId,
      yearId,
      "2025-02",
      false,
    );
    expect(result[0]?.dayOfMonth).toBe(28);
    expect(result[0]?.eventDateIso).toBe("2025-02-28");
  });

  it("includes a pupil enrolled from the middle of the month", async () => {
    const db = mockDb([
      {
        pupil: {
          id: "p-mid",
          firstName: "Ann",
          lastName: "Bee",
          middleName: null,
          birthDate: new Date("2014-03-05T00:00:00.000Z"),
        },
      },
    ]);
    await loadCalendarBirthdays(db as never, gradeId, yearId, "2026-03", false);
    expect(db.enrollment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          gradeId,
          academicYearId: yearId,
          startsOn: { lte: new Date(Date.UTC(2026, 2, 31)) },
        }),
      }),
    );
  });
});
