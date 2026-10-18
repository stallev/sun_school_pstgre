import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACCOUNT_STATUS,
  ACADEMIC_YEAR_STATUS,
  DELETION_REQUEST_STATUS,
  DELETION_REQUEST_TYPE,
  LESSON_KIND,
  MUTATION_ERROR_CODES,
  USER_ROLE,
} from "@sunschool/domain";

vi.mock("@sunschool/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sunschool/db")>();
  return { ...actual, writeAudit: vi.fn() };
});

vi.mock("./anonymize-user", () => ({
  anonymizeUserInTransaction: vi.fn().mockResolvedValue({ deletedOrdinal: 7 }),
}));

vi.mock("./erase-child-data", () => ({
  eraseChildDataInTransaction: vi.fn().mockResolvedValue({
    plan: { items: [{ category: "pupil", action: "delete", count: 1 }], warnings: [] },
  }),
}));

vi.mock("./preview-plan", () => ({
  gatherAccountPlanInput: vi.fn().mockResolvedValue({
    loginIdentityCount: 0,
    userRoleCount: 0,
    teacherAssignmentCount: 0,
    privacyConsentCount: 0,
    accessRequestCount: 0,
    auditLogUserTextCount: 0,
    assignedToActiveYearGroup: false,
    lessonsWithIncompleteChecks: 0,
    isSoleAdmin: false,
  }),
}));

import { saveCheckInTransaction } from "../checks/check-shared.server";
import { executeDeletion, executeDeletionInTransaction } from "./execute-deletion";
import { anonymizeUserInTransaction } from "./anonymize-user";
import { eraseChildDataInTransaction } from "./erase-child-data";

const actorId = "44444444-4444-4444-8444-444444444444";
const requestId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const subjectUserId = "11111111-1111-4111-8111-111111111111";
const pupilId = "88888888-8888-4888-8888-888888888888";
const orgId = "22222222-2222-4222-8222-222222222222";
const teacherId = "33333333-3333-4333-8333-333333333333";
const yearId = "55555555-5555-4555-8555-555555555555";
const gradeId = "44444444-4444-4444-8444-444444444444";
const lessonId = "77777777-7777-4777-8777-777777777777";
const now = new Date("2026-10-18T12:00:00.000Z");

const raceLessonRow = {
  id: lessonId,
  gradeId,
  academicYearId: yearId,
  title: "Урок",
  lessonDate: new Date("2026-10-15T00:00:00.000Z"),
  kind: LESSON_KIND.REGULAR,
  body: null,
  hasTest: false,
  leadTeacherId: teacherId,
  status: "HELD",
  createdAt: new Date("2026-10-15T08:00:00.000Z"),
};

const storedSummary = {
  items: [{ category: "pupil", action: "delete", count: 1 }],
};

describe("executeDeletion (deletion_requests §5.4, §8, §10)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects wrong confirm word before transaction", async () => {
    const db = { $transaction: vi.fn() };
    const result = await executeDeletion(
      db as never,
      actorId,
      { requestId, confirmWord: "wrong", acknowledgePlan: true },
      now,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe(MUTATION_ERROR_CODES.VALIDATION);
      expect(result.fields?.confirmWord).toBe("admin.deletions.confirm_wrong");
    }
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("returns stored summary when request already DONE", async () => {
    const tx = {
      userRoleAssignment: {
        findFirst: vi.fn().mockResolvedValue({ id: "r1" }),
      },
      $queryRaw: vi.fn().mockResolvedValue([
        {
          id: requestId,
          status: DELETION_REQUEST_STATUS.DONE,
          requestedById: actorId,
          subjectUserId: null,
          subjectPupilId: pupilId,
        },
      ]),
      deletionRequest: {
        findUnique: vi.fn().mockResolvedValue({ summary: storedSummary }),
        update: vi.fn(),
      },
    };

    const result = await executeDeletionInTransaction(
      tx as never,
      actorId,
      { requestId, confirmWord: "удалить", acknowledgePlan: true },
      now,
    );

    expect(result).toEqual({ ok: true, data: { summary: storedSummary } });
    expect(tx.deletionRequest.update).not.toHaveBeenCalled();
  });

  it("rejects last admin account deletion", async () => {
    const tx = {
      userRoleAssignment: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce({ id: "admin" })
          .mockResolvedValueOnce({ id: "admin" }),
        count: vi.fn().mockResolvedValue(1),
      },
      $queryRaw: vi
        .fn()
        .mockResolvedValueOnce([
          {
            id: requestId,
            status: DELETION_REQUEST_STATUS.IN_PROGRESS,
            requestedById: "other-admin",
            subjectUserId,
            subjectPupilId: null,
          },
        ])
        .mockResolvedValueOnce([{ id: subjectUserId }]),
      deletionRequest: {
        findUnique: vi.fn().mockResolvedValue({
          type: DELETION_REQUEST_TYPE.ACCOUNT,
          subjectUserId,
          subjectPupilId: null,
          requestedById: "other-admin",
        }),
        update: vi.fn(),
      },
      appUser: {
        findUnique: vi.fn().mockResolvedValue({
          status: ACCOUNT_STATUS.ACTIVE,
          organizationId: "org",
        }),
      },
    };
    const result = await executeDeletionInTransaction(
      tx as never,
      actorId,
      { requestId, confirmWord: "delete", acknowledgePlan: true },
      now,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(MUTATION_ERROR_CODES.DELETION_LAST_ADMIN);
    expect(anonymizeUserInTransaction).not.toHaveBeenCalled();
  });

  it("executes child request in one flow", async () => {
    const tx = {
      userRoleAssignment: {
        findFirst: vi.fn().mockResolvedValue({ id: "admin" }),
        count: vi.fn().mockResolvedValue(2),
      },
      $queryRaw: vi
        .fn()
        .mockResolvedValueOnce([
          {
            id: requestId,
            status: DELETION_REQUEST_STATUS.IN_PROGRESS,
            requestedById: "other",
            subjectUserId: null,
            subjectPupilId: pupilId,
          },
        ])
        .mockResolvedValueOnce([{ id: pupilId }]),
      deletionRequest: {
        findUnique: vi.fn().mockResolvedValue({
          type: DELETION_REQUEST_TYPE.CHILD_DATA,
          subjectUserId: null,
          subjectPupilId: pupilId,
          requestedById: "other",
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      appUser: {
        findUnique: vi.fn().mockResolvedValue({ organizationId: "org" }),
      },
      pupil: {
        findFirst: vi.fn().mockResolvedValue({ id: pupilId, isActive: true }),
      },
    };

    const result = await executeDeletionInTransaction(
      tx as never,
      actorId,
      { requestId, confirmWord: "удалить", acknowledgePlan: true },
      now,
    );

    expect(result.ok).toBe(true);
    expect(eraseChildDataInTransaction).toHaveBeenCalledWith(tx, pupilId);
    expect(tx.deletionRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: requestId },
        data: expect.objectContaining({
          subjectPupilId: null,
          subjectUserId: "other",
          reason: null,
        }),
      }),
    );
  });

  it("serializes child erasure with parallel homework check via pupil row lock (§10)", async () => {
    let pupilRowLocked = false;
    const lockWaiters: Array<() => void> = [];

    const acquirePupilRowLock = async () => {
      if (!pupilRowLocked) {
        pupilRowLocked = true;
        return;
      }
      await new Promise<void>((resolve) => {
        lockWaiters.push(resolve);
      });
      pupilRowLocked = true;
    };

    const releasePupilRowLock = () => {
      const next = lockWaiters.shift();
      if (next) next();
      else pupilRowLocked = false;
    };

    let pupilDeleted = false;

    vi.mocked(eraseChildDataInTransaction).mockImplementationOnce(async () => {
      await new Promise((resolve) => setTimeout(resolve, 15));
      pupilDeleted = true;
      return {
        plan: { items: [{ category: "pupil", action: "delete", count: 1 }], warnings: [] },
      };
    });

    const queryRawSql = (query: unknown): string => {
      if (Array.isArray(query)) return query.join(" ");
      return String(query);
    };

    const tx = {
      userRoleAssignment: {
        findFirst: vi.fn().mockResolvedValue({ id: "admin" }),
        count: vi.fn().mockResolvedValue(2),
      },
      $queryRaw: vi.fn().mockImplementation(async (query: unknown) => {
        const sql = queryRawSql(query);
        if (sql.includes("deletion_request")) {
          return [
            {
              id: requestId,
              status: DELETION_REQUEST_STATUS.IN_PROGRESS,
              requestedById: "other",
              subjectUserId: null,
              subjectPupilId: pupilId,
            },
          ];
        }
        if (sql.includes("academic_year")) {
          return [{ id: yearId }];
        }
        if (sql.includes("FROM pupil")) {
          await acquirePupilRowLock();
          return pupilDeleted ? [] : [{ id: pupilId }];
        }
        if (sql.includes("homework_check")) {
          return [];
        }
        return [];
      }),
      deletionRequest: {
        findUnique: vi.fn().mockResolvedValue({
          type: DELETION_REQUEST_TYPE.CHILD_DATA,
          subjectUserId: null,
          subjectPupilId: pupilId,
          requestedById: "other",
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      appUser: {
        findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
        findFirst: vi.fn().mockResolvedValue({
          roles: [{ role: USER_ROLE.TEACHER }],
        }),
      },
      pupil: {
        findFirst: vi.fn().mockImplementation(async () =>
          pupilDeleted ? null : { id: pupilId, isActive: true },
        ),
      },
      enrollment: {
        findFirst: vi.fn().mockImplementation(async () => (pupilDeleted ? null : { id: "enroll-1" })),
      },
      academicYear: {
        findFirst: vi.fn().mockResolvedValue({
          id: yearId,
          status: ACADEMIC_YEAR_STATUS.ACTIVE,
          startsOn: new Date("2026-09-01T00:00:00.000Z"),
          endsOn: new Date("2027-06-01T00:00:00.000Z"),
          organizationId: orgId,
        }),
      },
      lesson: {
        findFirst: vi.fn().mockResolvedValue(raceLessonRow),
        findMany: vi.fn().mockResolvedValue([raceLessonRow]),
      },
      teacherAssignment: {
        findUnique: vi.fn().mockResolvedValue({ id: "assign-1" }),
      },
      appSetting: { findFirst: vi.fn().mockResolvedValue({ value: "Europe/Moscow" }) },
      gradeSettings: {
        findUnique: vi.fn().mockResolvedValue({
          useVerses: true,
          useTest: true,
          useNotebook: true,
          useSinging: true,
          maxVersesPerLesson: 3,
          weights: {},
        }),
      },
      homeworkCheck: {
        create: vi.fn().mockResolvedValue({ id: "check-race" }),
        update: vi.fn(),
        findUniqueOrThrow: vi.fn(),
      },
      homeworkScoreEvent: { create: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
      homeworkVerseScore: {
        findMany: vi.fn().mockResolvedValue([]),
        upsert: vi.fn(),
        deleteMany: vi.fn(),
      },
      auditLog: { create: vi.fn() },
    };

    async function parallelHomeworkSave() {
      await new Promise((resolve) => setTimeout(resolve, 2));
      try {
        return await saveCheckInTransaction(
          tx as never,
          teacherId,
          orgId,
          {
            lessonId,
            pupilId,
            lessonKind: LESSON_KIND.REGULAR,
            present: true,
            notebookScore: 8,
          },
          "partial",
        );
      } finally {
        releasePupilRowLock();
      }
    }

    const [deletionResult, checkResult] = await Promise.all([
      executeDeletionInTransaction(
        tx as never,
        actorId,
        { requestId, confirmWord: "удалить", acknowledgePlan: true },
        now,
      ).finally(() => releasePupilRowLock()),
      parallelHomeworkSave(),
    ]);

    expect(deletionResult.ok).toBe(true);
    expect(checkResult.ok).toBe(false);
    if (!checkResult.ok) {
      expect(checkResult.code).toBe(MUTATION_ERROR_CODES.NOT_FOUND);
    }
    expect(eraseChildDataInTransaction).toHaveBeenCalledWith(tx, pupilId);
    expect(pupilDeleted).toBe(true);
  });
});
