import { describe, expect, it, vi } from "vitest";
import {
  ACCOUNT_STATUS,
  DELETION_REQUEST_STATUS,
  DELETION_REQUEST_TYPE,
  MUTATION_ERROR_CODES,
  USER_ROLE,
} from "@sunschool/domain";
import { cancelOwnChildDeletionRequestInTransaction } from "./cancel-own-child-deletion-request";
import { createOwnChildDeletionRequestInTransaction } from "./create-own-child-deletion-request";
import { loadOpenChildDeletionForFamily } from "./load-open-child-deletion-for-family.server";

vi.mock("@sunschool/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sunschool/db")>();
  return { ...actual, writeAudit: vi.fn() };
});

const actorUserId = "55555555-5555-4555-8555-555555555555";
const otherAdultUserId = "66666666-6666-4666-8666-666666666666";
const pupilId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const guardianAdultId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const requestId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const orgId = "33333333-3333-4333-8333-333333333333";
const familyId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const now = new Date("2026-10-23T12:00:00.000Z");
const schoolTz = "Europe/Moscow";

function parentTx(overrides: Record<string, unknown> = {}) {
  return {
    appUser: {
      findUnique: vi.fn().mockResolvedValue({
        id: actorUserId,
        status: ACCOUNT_STATUS.ACTIVE,
        organizationId: orgId,
        roles: [{ role: USER_ROLE.PARENT }],
      }),
    },
    appSetting: {
      findUnique: vi.fn(async ({ where }: { where: { key: string } }) => {
        if (where.key === "features.parents") return { value: true };
        return null;
      }),
    },
    pupil: {
      findFirst: vi.fn().mockResolvedValue({ id: pupilId, familyId }),
    },
    familyAdult: {
      findFirst: vi.fn().mockResolvedValue({ id: guardianAdultId }),
    },
    $queryRaw: vi.fn(),
    deletionRequest: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: requestId }),
      update: vi.fn(),
    },
    ...overrides,
  };
}

describe("parent child deletion (families §6.4, AZ-62)", () => {
  it("createOwnChildDeletionRequest returns CONFLICT when open request exists", async () => {
    const tx = parentTx({
      deletionRequest: {
        findFirst: vi.fn().mockResolvedValue({ id: requestId }),
        create: vi.fn(),
      },
    });

    const result = await createOwnChildDeletionRequestInTransaction(
      tx as never,
      actorUserId,
      { pupilId },
      now,
      schoolTz,
    );

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.CONFLICT,
      message: "parent.deletion.already_open",
    });
    expect(tx.deletionRequest.create).not.toHaveBeenCalled();
  });

  it("createOwnChildDeletionRequest returns NOT_FOUND for foreign child (AZ-D4)", async () => {
    const tx = parentTx({
      familyAdult: { findFirst: vi.fn().mockResolvedValue(null) },
    });

    const result = await createOwnChildDeletionRequestInTransaction(
      tx as never,
      actorUserId,
      { pupilId },
      now,
      schoolTz,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(MUTATION_ERROR_CODES.NOT_FOUND);
  });

  it("createOwnChildDeletionRequest creates request on happy path", async () => {
    const tx = parentTx({
      $queryRaw: vi.fn().mockResolvedValue([{ id: pupilId }]),
    });

    const result = await createOwnChildDeletionRequestInTransaction(
      tx as never,
      actorUserId,
      { pupilId, reason: "please remove" },
      now,
      schoolTz,
    );

    expect(result).toEqual({ ok: true, data: { requestId } });
    expect(tx.deletionRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: DELETION_REQUEST_TYPE.CHILD_DATA,
          subjectPupilId: pupilId,
          requestedById: actorUserId,
          reason: "please remove",
        }),
      }),
    );
  });

  it("cancelOwnChildDeletionRequest forbids non-author family parent", async () => {
    const tx = parentTx({
      $queryRaw: vi.fn().mockResolvedValue([
        {
          id: requestId,
          status: DELETION_REQUEST_STATUS.NEW,
          requestedById: otherAdultUserId,
          subjectUserId: null,
          subjectPupilId: pupilId,
        },
      ]),
    });

    const result = await cancelOwnChildDeletionRequestInTransaction(
      tx as never,
      actorUserId,
      { requestId },
      now,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(MUTATION_ERROR_CODES.FORBIDDEN);
  });

  it("loadOpenChildDeletionForFamily exposes open request to another family adult", async () => {
    const dueOn = new Date("2026-11-07T00:00:00.000Z");
    const db = {
      $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          appUser: {
            findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
          },
          appSetting: {
            findUnique: vi.fn(async ({ where }: { where: { key: string } }) =>
              where.key === "features.parents" ? { value: true } : null,
            ),
          },
          pupil: {
            findFirst: vi.fn().mockResolvedValue({ familyId }),
          },
          familyAdult: {
            findFirst: vi.fn().mockResolvedValue({ id: guardianAdultId }),
          },
        }),
      ),
      deletionRequest: {
        findFirst: vi.fn().mockResolvedValue({
          id: requestId,
          status: DELETION_REQUEST_STATUS.NEW,
          requestedAt: now,
          dueOn,
          requestedById: otherAdultUserId,
        }),
      },
    };

    const view = await loadOpenChildDeletionForFamily(db as never, actorUserId, pupilId);

    expect(view).toEqual({
      requestId,
      status: DELETION_REQUEST_STATUS.NEW,
      requestedAt: now,
      dueOn: "2026-11-07",
      requestedByCurrentUser: false,
    });
  });
});
