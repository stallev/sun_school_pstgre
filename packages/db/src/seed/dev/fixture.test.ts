import {
  ACADEMIC_YEAR_STATUS,
  ACCESS_REQUEST_STATUS,
  ACCOUNT_STATUS,
  CONSENT_STATUS,
  DELETION_REQUEST_STATUS,
  DELETION_REQUEST_TYPE,
  GRADE_EVENT_TYPE,
  LESSON_STATUS,
} from "@sunschool/domain";
import { describe, expect, it } from "vitest";
import { FIXTURE_PUPIL_CONSENT, GRADE_KEY, YEAR_KEY, buildFixture, type GradeKey } from "./fixture";
import { buildPeopleFixture } from "./people";

const fixture = buildFixture();
const people = buildPeopleFixture(fixture);

const covers = (startsOn: string, endsOn: string | null, date: string): boolean =>
  startsOn <= date && (endsOn === null || date <= endsOn);

describe("buildFixture", () => {
  it("keeps a single active year and about 30 open enrollments in each group", () => {
    const active = fixture.years.filter((year) => year.status === ACADEMIC_YEAR_STATUS.ACTIVE);
    expect(active).toHaveLength(1);
    const activeKey = active[0]!.key;
    for (const gradeKey of Object.values(GRADE_KEY) as GradeKey[]) {
      const open = fixture.enrollments.filter(
        (row) => row.yearKey === activeKey && row.gradeKey === gradeKey && row.endsOn === null,
      );
      expect(open.length).toBeGreaterThanOrEqual(28);
      expect(open.length).toBeLessThanOrEqual(32);
    }
    const openByPupil = new Map<string, number>();
    for (const row of fixture.enrollments) {
      if (row.endsOn !== null) continue;
      openByPupil.set(row.pupilKey, (openByPupil.get(row.pupilKey) ?? 0) + 1);
    }
    expect([...openByPupil.values()].every((count) => count === 1)).toBe(true);
  });

  it("moves some pupils between groups, including mid-year", () => {
    const groupsByPupilYear = new Map<string, Set<GradeKey>>();
    for (const row of fixture.enrollments) {
      const key = `${row.pupilKey}|${row.yearKey}`;
      const grades = groupsByPupilYear.get(key) ?? new Set<GradeKey>();
      grades.add(row.gradeKey);
      groupsByPupilYear.set(key, grades);
    }
    const midYear = [...groupsByPupilYear.values()].filter((grades) => grades.size > 1);
    expect(midYear.length).toBeGreaterThanOrEqual(2);
  });

  it("leaves a held lesson only partly checked and marks a few checks late", () => {
    const held = fixture.lessons.filter((lesson) => lesson.status === LESSON_STATUS.HELD);
    expect(held.length).toBeGreaterThan(0);
    for (const lesson of held) {
      const enrolled = fixture.enrollments.filter(
        (row) =>
          row.gradeKey === lesson.gradeKey &&
          row.yearKey === lesson.yearKey &&
          covers(row.startsOn, row.endsOn, lesson.date),
      ).length;
      const checked = fixture.checks.filter(
        (row) => row.gradeKey === lesson.gradeKey && row.yearKey === lesson.yearKey && row.lessonIndex === lesson.index,
      ).length;
      expect(checked).toBeGreaterThan(0);
      expect(checked).toBeLessThan(enrolled);
    }
    expect(fixture.checks.filter((row) => row.late).length).toBeGreaterThanOrEqual(3);
  });

  it("keeps four low-attendance pupils, pupils outside groups, and a compensating brick", () => {
    const activeKey = fixture.years.find((year) => year.status === ACADEMIC_YEAR_STATUS.ACTIVE)!.key;
    const activePupils = new Set(
      fixture.enrollments.filter((row) => row.yearKey === activeKey && row.endsOn === null).map((row) => row.pupilKey),
    );
    const low = fixture.pupils.filter((pupil) => activePupils.has(pupil.key) && pupil.attendance < 0.5);
    expect(low.length).toBeGreaterThanOrEqual(4);

    const enrolled = new Set(fixture.enrollments.map((row) => row.pupilKey));
    const outside = fixture.pupils.filter((pupil) => !enrolled.has(pupil.key));
    expect(outside.filter((pupil) => pupil.consent === FIXTURE_PUPIL_CONSENT.PAPER && pupil.isActive)).toHaveLength(2);
    expect(outside.filter((pupil) => pupil.consent === FIXTURE_PUPIL_CONSENT.NONE)).toHaveLength(1);
    expect(outside.filter((pupil) => !pupil.isActive)).toHaveLength(1);
    expect(
      fixture.pupils.filter((pupil) => pupil.consent === CONSENT_STATUS.LEGACY_PENDING && enrolled.has(pupil.key)),
    ).toHaveLength(1);

    expect(fixture.bricks.some((row) => row.quantity < 0)).toBe(true);
  });

  it("covers access and deletion queues and the calendar", () => {
    expect(people.accessRequests.length).toBeGreaterThanOrEqual(4);
    const accessStatuses = new Set(people.accessRequests.map((row) => row.status));
    expect(accessStatuses.has(ACCESS_REQUEST_STATUS.PENDING)).toBe(true);
    expect(accessStatuses.has(ACCESS_REQUEST_STATUS.APPROVED)).toBe(true);
    expect(accessStatuses.has(ACCESS_REQUEST_STATUS.REJECTED)).toBe(true);
    expect(
      people.accessRequests.some(
        (row) => row.status === ACCESS_REQUEST_STATUS.REJECTED && row.rejectReason?.includes("родител"),
      ),
    ).toBe(true);

    expect(people.deletions.length).toBeGreaterThanOrEqual(4);
    const deletionStatuses = new Set(people.deletions.map((row) => row.status));
    expect(deletionStatuses.has(DELETION_REQUEST_STATUS.NEW)).toBe(true);
    expect(deletionStatuses.has(DELETION_REQUEST_STATUS.IN_PROGRESS)).toBe(true);
    expect(deletionStatuses.has(DELETION_REQUEST_STATUS.CANCELLED)).toBe(true);
    expect(deletionStatuses.has(DELETION_REQUEST_STATUS.REJECTED)).toBe(true);
    expect(deletionStatuses.has(DELETION_REQUEST_STATUS.DONE)).toBe(false);
    const deletionTypes = new Set(people.deletions.map((row) => row.type));
    expect(deletionTypes.has(DELETION_REQUEST_TYPE.ACCOUNT)).toBe(true);
    expect(deletionTypes.has(DELETION_REQUEST_TYPE.CHILD_DATA)).toBe(true);

    const accountStatuses = new Set(people.users.map((row) => row.status));
    for (const status of [
      ACCOUNT_STATUS.REGISTRATION,
      ACCOUNT_STATUS.REQUEST_PENDING,
      ACCOUNT_STATUS.REJECTED,
      ACCOUNT_STATUS.ACTIVE,
      ACCOUNT_STATUS.DISABLED,
    ]) {
      expect(accountStatuses.has(status)).toBe(true);
    }
    const names = people.users.map((row) => `${row.lastName}|${row.firstName}`);
    expect(names.some((name, index) => names.indexOf(name) !== index)).toBe(true);
    for (const user of people.users) expect(user.email.endsWith("@example.test")).toBe(true);

    expect(people.events.filter((row) => row.type === GRADE_EVENT_TYPE.LESSON)).toHaveLength(fixture.lessons.length);
    const activeKey = YEAR_KEY.Y3;
    for (const gradeKey of Object.values(GRADE_KEY)) {
      expect(people.events.some((row) => row.gradeKey === gradeKey && row.yearKey === activeKey && row.type === GRADE_EVENT_TYPE.TRIP)).toBe(true);
      expect(
        people.events.some(
          (row) => row.gradeKey === gradeKey && row.yearKey === activeKey && row.type === GRADE_EVENT_TYPE.CANCELLATION,
        ),
      ).toBe(true);
    }
  });
});
