import { describe, expect, it, vi } from "vitest";
import { AUDIT_ACTION, GRADE_EVENT_TYPE, MUTATION_ERROR_CODES, USER_ROLE } from "@sunschool/domain";
import { createCalendarEvent } from "./create-event";

vi.mock("@sunschool/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sunschool/db")>();
  return { ...actual, writeAudit: vi.fn() };
});

const orgId = "22222222-2222-4222-8222-222222222222";
const actorUserId = "33333333-3333-4333-8333-333333333333";
const gradeId = "44444444-4444-4444-8444-444444444444";
const yearId = "55555555-5555-4555-8555-555555555555";
const lessonId = "77777777-7777-4777-8777-777777777777";

const baseInput = {
  gradeId,
  eventDate: "2026-10-15",
  type: GRADE_EVENT_TYPE.TRIP,
  title: "Trip",
};

describe("createCalendarEvent", () => {
  it("returns NOT_FOUND when teacher is not assigned to the group", async () => {
    const tx = {
      appUser: {
        findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
        findFirst: vi.fn().mockResolvedValue({ roles: [{ role: USER_ROLE.TEACHER }] }),
      },
      grade: { findFirst: vi.fn().mockResolvedValue({ id: gradeId, isActive: true }) },
      academicYear: {
        findFirst: vi.fn().mockResolvedValue({
          id: yearId,
          status: "ACTIVE",
          startsOn: new Date("2026-09-01T00:00:00.000Z"),
          endsOn: new Date("2027-06-01T00:00:00.000Z"),
          organizationId: orgId,
        }),
      },
      teacherAssignment: { findUnique: vi.fn().mockResolvedValue(null) },
      userRoleAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
      gradeEvent: { create: vi.fn() },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await createCalendarEvent(db as never, actorUserId, baseInput);

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.NOT_FOUND,
      message: "common.errors.not_found",
    });
  });

  it("returns FORBIDDEN when school year is not active for teacher", async () => {
    const tx = {
      appUser: {
        findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
        findFirst: vi.fn().mockResolvedValue({ roles: [{ role: USER_ROLE.TEACHER }] }),
      },
      grade: { findFirst: vi.fn().mockResolvedValue({ id: gradeId, isActive: true }) },
      academicYear: {
        findFirst: vi.fn().mockResolvedValue({
          id: yearId,
          status: "CLOSED",
          startsOn: new Date("2026-09-01T00:00:00.000Z"),
          endsOn: new Date("2027-06-01T00:00:00.000Z"),
          organizationId: orgId,
        }),
      },
      teacherAssignment: { findUnique: vi.fn().mockResolvedValue({ id: "assign" }) },
      userRoleAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
      gradeEvent: { create: vi.fn() },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await createCalendarEvent(db as never, actorUserId, baseInput);

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.FORBIDDEN,
      message: "common.errors.year_closed",
    });
  });

  it("returns NOT_FOUND when LESSON type links a lesson from another group", async () => {
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: yearId }]),
      appUser: {
        findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
        findFirst: vi.fn().mockResolvedValue({ roles: [{ role: USER_ROLE.ADMIN }] }),
      },
      grade: { findFirst: vi.fn().mockResolvedValue({ id: gradeId, isActive: true }) },
      academicYear: {
        findFirst: vi.fn().mockResolvedValue({
          id: yearId,
          status: "ACTIVE",
          startsOn: new Date("2026-09-01T00:00:00.000Z"),
          endsOn: new Date("2027-06-01T00:00:00.000Z"),
          organizationId: orgId,
        }),
        findUnique: vi.fn().mockResolvedValue({ id: yearId }),
      },
      teacherAssignment: { findUnique: vi.fn() },
      userRoleAssignment: { findFirst: vi.fn().mockResolvedValue({ role: USER_ROLE.ADMIN }) },
      lesson: {
        findFirst: vi.fn().mockResolvedValue({
          id: lessonId,
          gradeId: "99999999-9999-4999-8999-999999999999",
          academicYearId: yearId,
          title: "L",
          lessonDate: new Date("2026-10-15T00:00:00.000Z"),
          kind: "REGULAR",
          body: null,
          hasTest: false,
          leadTeacherId: actorUserId,
          status: "HELD",
          createdAt: new Date(),
        }),
      },
      gradeEvent: { create: vi.fn() },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await createCalendarEvent(db as never, actorUserId, {
      ...baseInput,
      type: GRADE_EVENT_TYPE.LESSON,
      lessonId,
    });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.NOT_FOUND,
      message: "common.errors.not_found",
    });
  });

  it("writes calendar.event_created audit on success", async () => {
    const { writeAudit } = await import("@sunschool/db");
    const eventId = "88888888-8888-4888-8888-888888888888";
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: yearId }]),
      appUser: {
        findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
        findFirst: vi.fn().mockResolvedValue({ roles: [{ role: USER_ROLE.ADMIN }] }),
      },
      grade: { findFirst: vi.fn().mockResolvedValue({ id: gradeId, isActive: true }) },
      academicYear: {
        findFirst: vi.fn().mockResolvedValue({
          id: yearId,
          status: "ACTIVE",
          startsOn: new Date("2026-09-01T00:00:00.000Z"),
          endsOn: new Date("2027-06-01T00:00:00.000Z"),
          organizationId: orgId,
        }),
        findUnique: vi.fn().mockResolvedValue({ id: yearId }),
      },
      teacherAssignment: { findUnique: vi.fn() },
      userRoleAssignment: { findFirst: vi.fn().mockResolvedValue({ role: USER_ROLE.ADMIN }) },
      gradeEvent: { create: vi.fn().mockResolvedValue({ id: eventId }) },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await createCalendarEvent(db as never, actorUserId, baseInput);

    expect(result).toEqual({ ok: true, data: { eventId } });
    expect(writeAudit).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ action: AUDIT_ACTION.CALENDAR_EVENT_CREATED, entityId: eventId }),
    );
  });
});
