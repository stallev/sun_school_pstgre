import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACCOUNT_STATUS,
  AUDIT_ACTION,
  DELETION_REQUEST_STATUS,
  DELETION_REQUEST_TYPE,
  MUTATION_ERROR_CODES,
} from "@sunschool/domain";
import { cancelDeletionRequestInTransaction } from "./cancel-request";
import { createChildDeletionRequestInTransaction } from "./create-child-request";
import { createDeletionRequestInTransaction } from "./create-request";
import { rejectDeletionRequestInTransaction } from "./reject-request";
import { takeDeletionRequestInTransaction } from "./take-request";

vi.mock("@sunschool/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sunschool/db")>();
  return { ...actual, writeAudit: vi.fn() };
});

const actorUserId = "33333333-3333-4333-8333-333333333333";
const adminId = "44444444-4444-4444-8444-444444444444";
const teacherId = "55555555-5555-4555-8555-555555555555";
const pupilId = "88888888-8888-4888-8888-888888888888";
const orgId = "22222222-2222-4222-8222-222222222222";
const requestId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const now = new Date("2026-10-18T12:00:00.000Z");
const schoolTz = "Europe/Moscow";

describe("deletion request lifecycle (deletion_requests §5–§8, §10)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createDeletionRequest returns DELETION_ALREADY_OPEN when open request exists", async () => {
    const tx = {
      appUser: {
        findUnique: vi.fn().mockResolvedValue({ status: ACCOUNT_STATUS.ACTIVE }),
      },
      deletionRequest: {
        findFirst: vi.fn().mockResolvedValue({ id: requestId }),
        create: vi.fn(),
      },
    };

    const result = await createDeletionRequestInTransaction(tx as never, actorUserId, {}, now, schoolTz);

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.DELETION_ALREADY_OPEN,
      message: "common.deletion.already_open",
    });
    expect(tx.deletionRequest.create).not.toHaveBeenCalled();
  });

  it("createDeletionRequest maps unique violation race to DELETION_ALREADY_OPEN", async () => {
    const p2002 = Object.assign(new Error("unique"), { code: "P2002" });
    const tx = {
      appUser: {
        findUnique: vi.fn().mockResolvedValue({ status: ACCOUNT_STATUS.ACTIVE }),
      },
      deletionRequest: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockRejectedValue(p2002),
      },
    };

    const result = await createDeletionRequestInTransaction(tx as never, actorUserId, {}, now, schoolTz);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(MUTATION_ERROR_CODES.DELETION_ALREADY_OPEN);
  });

  it("createChildDeletionRequest forbids teacher (AZ-07)", async () => {
    const tx = {
      userRoleAssignment: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };

    const result = await createChildDeletionRequestInTransaction(
      tx as never,
      teacherId,
      { pupilId, guardianNote: "guardian contacted school" },
      now,
      schoolTz,
    );

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.FORBIDDEN,
      message: "common.errors.forbidden",
    });
  });

  it("rejectDeletionRequest requires reason", async () => {
    const { rejectDeletionRequestInputSchema } = await import("@sunschool/domain");
    expect(rejectDeletionRequestInputSchema.safeParse({ requestId, reason: "" }).success).toBe(false);
  });

  it("rejectDeletionRequest rejects without open status", async () => {
    const tx = {
      userRoleAssignment: {
        findFirst: vi.fn().mockResolvedValue({ id: "role-admin" }),
      },
      $queryRaw: vi.fn().mockResolvedValue([
        {
          id: requestId,
          status: DELETION_REQUEST_STATUS.DONE,
          requestedById: actorUserId,
          subjectUserId: actorUserId,
          subjectPupilId: null,
        },
      ]),
      deletionRequest: { update: vi.fn() },
    };

    const result = await rejectDeletionRequestInTransaction(
      tx as never,
      adminId,
      { requestId, reason: "duplicate request" },
      now,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(MUTATION_ERROR_CODES.DELETION_STATUS_INVALID);
    expect(tx.deletionRequest.update).not.toHaveBeenCalled();
  });

  it("cancelDeletionRequest allows only author", async () => {
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([
        {
          id: requestId,
          status: DELETION_REQUEST_STATUS.NEW,
          requestedById: actorUserId,
          subjectUserId: actorUserId,
          subjectPupilId: null,
        },
      ]),
      deletionRequest: { update: vi.fn() },
    };

    const forbidden = await cancelDeletionRequestInTransaction(
      tx as never,
      adminId,
      { requestId },
      now,
    );
    expect(forbidden.ok).toBe(false);
    if (!forbidden.ok) expect(forbidden.code).toBe(MUTATION_ERROR_CODES.FORBIDDEN);

    const ok = await cancelDeletionRequestInTransaction(tx as never, actorUserId, { requestId }, now);
    expect(ok.ok).toBe(true);
  });

  it("takeDeletionRequest writes deletion.taken audit on success", async () => {
    const tx = {
      userRoleAssignment: {
        findFirst: vi.fn().mockResolvedValue({ id: "role-admin" }),
      },
      $queryRaw: vi.fn().mockResolvedValue([
        {
          id: requestId,
          status: DELETION_REQUEST_STATUS.NEW,
          requestedById: actorUserId,
          subjectUserId: actorUserId,
          subjectPupilId: null,
        },
      ]),
      deletionRequest: {
        update: vi.fn().mockResolvedValue({ id: requestId }),
      },
    };

    const result = await takeDeletionRequestInTransaction(tx as never, adminId, { requestId }, now);
    expect(result.ok).toBe(true);

    const { writeAudit } = await import("@sunschool/db");
    expect(writeAudit).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ action: AUDIT_ACTION.DELETION_TAKEN, entityId: requestId }),
    );
  });

  it("createChildDeletionRequest succeeds for admin with audit deletion.requested", async () => {
    const tx = {
      userRoleAssignment: {
        findFirst: vi.fn().mockResolvedValue({ id: "role-admin" }),
      },
      appUser: {
        findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
      },
      pupil: {
        findFirst: vi.fn().mockResolvedValue({ id: pupilId, isActive: true }),
      },
      $queryRaw: vi.fn().mockResolvedValue([{ id: pupilId }]),
      deletionRequest: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: requestId }),
      },
    };

    const result = await createChildDeletionRequestInTransaction(
      tx as never,
      adminId,
      { pupilId, guardianNote: "guardian called" },
      now,
      schoolTz,
    );

    expect(result).toEqual({ ok: true, data: { requestId } });
    const { writeAudit } = await import("@sunschool/db");
    expect(writeAudit).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: AUDIT_ACTION.DELETION_REQUESTED,
        newValue: { type: DELETION_REQUEST_TYPE.CHILD_DATA, subjectPupilId: pupilId },
      }),
    );
  });
});
