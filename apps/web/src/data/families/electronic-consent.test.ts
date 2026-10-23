import { describe, expect, it, vi } from "vitest";
import {
  ACCOUNT_STATUS,
  CONSENT_CHANNEL,
  CONSENT_STATUS,
  DELETION_REQUEST_TYPE,
  MUTATION_ERROR_CODES,
  USER_ROLE,
} from "@sunschool/domain";
import { eraseChildDataInTransaction } from "../deletions/erase-child-data";
import { giveElectronicConsentInTransaction } from "./give-electronic-consent";
import { revokeElectronicConsentInTransaction } from "./revoke-electronic-consent";

vi.mock("../deletions/erase-child-data", () => ({
  eraseChildDataInTransaction: vi.fn(),
}));

const actorUserId = "55555555-5555-4555-8555-555555555555";
const pupilId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const guardianAdultId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const consentId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const deletionRequestId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const revokeNow = new Date("2026-10-23T12:00:00.000Z");
const orgId = "33333333-3333-4333-8333-333333333333";
const familyId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

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
        if (where.key === "child_data_consent_text_version") return { value: "v1" };
        return null;
      }),
    },
    pupil: {
      findFirst: vi.fn().mockResolvedValue({ id: pupilId, familyId }),
    },
    familyAdult: {
      findFirst: vi.fn().mockResolvedValue({ id: guardianAdultId }),
    },
    childDataConsent: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: consentId }),
      count: vi.fn(),
      update: vi.fn(),
    },
    $queryRaw: vi.fn().mockResolvedValue([{ id: pupilId }]),
    deletionRequest: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
    },
    auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) },
    ...overrides,
  };
}

describe("giveElectronicConsentInTransaction", () => {
  it("returns NOT_FOUND for foreign child", async () => {
    const tx = parentTx({
      familyAdult: { findFirst: vi.fn().mockResolvedValue(null) },
    });

    const result = await giveElectronicConsentInTransaction(
      tx as never,
      actorUserId,
      { pupilId, accepted: true },
      "2026-10-23",
    );

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.NOT_FOUND,
      message: "common.errors.not_found",
    });
  });

  it("creates ELECTRONIC consent with guardian adult", async () => {
    const tx = parentTx();

    const result = await giveElectronicConsentInTransaction(
      tx as never,
      actorUserId,
      { pupilId, accepted: true },
      "2026-10-23",
    );

    expect(result).toEqual({ ok: true, data: { consentId } });
    expect(tx.childDataConsent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          channel: CONSENT_CHANNEL.ELECTRONIC,
          guardianAdultId,
          status: CONSENT_STATUS.ACTIVE,
        }),
      }),
    );
  });
});

describe("revokeElectronicConsentInTransaction", () => {
  it("returns CONSENT_LAST_REQUIRES_DELETION for last consent without confirm", async () => {
    const tx = parentTx({
      childDataConsent: {
        findFirst: vi.fn().mockResolvedValue({ id: consentId }),
        count: vi.fn().mockResolvedValue(0),
        update: vi.fn(),
      },
    });

    const result = await revokeElectronicConsentInTransaction(
      tx as never,
      actorUserId,
      { pupilId, confirmDeletion: false },
      new Date("2026-10-23T12:00:00.000Z"),
      "Europe/Moscow",
    );

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.CONSENT_LAST_REQUIRES_DELETION,
      message: "parent.consent.confirm_deletion",
    });
    expect(tx.childDataConsent.update).not.toHaveBeenCalled();
  });

  it("revokes non-last active consent without deletion request", async () => {
    const tx = parentTx({
      childDataConsent: {
        findFirst: vi.fn().mockResolvedValue({ id: consentId }),
        count: vi.fn().mockResolvedValue(1),
        update: vi.fn().mockResolvedValue({ id: consentId }),
      },
    });

    const result = await revokeElectronicConsentInTransaction(
      tx as never,
      actorUserId,
      { pupilId, confirmDeletion: false },
      revokeNow,
      "Europe/Moscow",
    );

    expect(result).toEqual({ ok: true, data: {} });
    expect(tx.childDataConsent.update).toHaveBeenCalledWith({
      where: { id: consentId },
      data: {
        status: CONSENT_STATUS.REVOKED,
        revokedAt: revokeNow,
      },
    });
    expect(tx.deletionRequest.create).not.toHaveBeenCalled();
    expect(eraseChildDataInTransaction).not.toHaveBeenCalled();
  });

  it("revokes last active consent with confirmDeletion and creates deletion request", async () => {
    const tx = parentTx({
      childDataConsent: {
        findFirst: vi.fn().mockResolvedValue({ id: consentId }),
        count: vi.fn().mockResolvedValue(0),
        update: vi.fn().mockResolvedValue({ id: consentId }),
      },
      deletionRequest: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: deletionRequestId }),
      },
    });

    const result = await revokeElectronicConsentInTransaction(
      tx as never,
      actorUserId,
      { pupilId, confirmDeletion: true },
      revokeNow,
      "Europe/Moscow",
    );

    expect(result).toEqual({ ok: true, data: { requestId: deletionRequestId } });
    expect(tx.deletionRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: DELETION_REQUEST_TYPE.CHILD_DATA,
          subjectPupilId: pupilId,
          requestedById: actorUserId,
        }),
      }),
    );
    expect(tx.childDataConsent.update).toHaveBeenCalled();
    expect(eraseChildDataInTransaction).not.toHaveBeenCalled();
  });
});
