import { describe, expect, it, vi } from "vitest";
import {
  AUDIT_ACTION,
  CONSENT_CHANNEL,
  CONSENT_STATUS,
  MUTATION_ERROR_CODES,
  canEnroll,
  serializeAuditValues,
  ACADEMIC_YEAR_STATUS,
} from "@sunschool/domain";
import { createPupil } from "./create-pupil";
import { recordPaperConsent } from "./record-paper-consent";
import { revokeConsent } from "./revoke-consent";
import { toTeacherPupilConsentView } from "./pupil-consent-view.server";
import { validateSignedOnNotInFuture } from "./school-pupil-shared.server";

const orgId = "33333333-3333-4333-8333-333333333333";
const actorUserId = "55555555-5555-4555-8555-555555555555";
const pupilId = "66666666-6666-4666-8666-666666666666";
const consentId = "77777777-7777-4777-8777-777777777777";

describe("createPupil", () => {
  it("creates a pupil without consent and omits names from audit payload", async () => {
    const auditCreate = vi.fn().mockResolvedValue(undefined);
    const tx = {
      appUser: {
        findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
      },
      pupil: {
        create: vi.fn().mockResolvedValue({ id: pupilId }),
      },
      auditLog: { create: auditCreate },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await createPupil(db as never, actorUserId, {
      lastName: "Иванов",
      firstName: "Пётр",
      birthDate: "2015-05-01",
      isActive: true,
    });

    expect(result).toEqual({ ok: true, data: { pupilId } });
    expect(tx.pupil.create).toHaveBeenCalled();
    const auditPayload = auditCreate.mock.calls[0]?.[0]?.data?.newValue;
    expect(serializeAuditValues(auditPayload)).toEqual({ isActive: true });
    expect(serializeAuditValues({ lastName: "Иванов", ...auditPayload })).toEqual({
      isActive: true,
    });
  });
});

describe("recordPaperConsent", () => {
  it("rejects a future signedOn date", () => {
    expect(validateSignedOnNotInFuture("2099-01-01", "2026-01-01")?.code).toBe(
      MUTATION_ERROR_CODES.VALIDATION,
    );
  });

  it("rejects missing signer via schema", async () => {
    const db = { $transaction: vi.fn() };
    const result = await recordPaperConsent(db as never, actorUserId, {
      pupilId,
      signerName: "   ",
      signedOn: "2026-01-01",
      textVersion: "v1",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(MUTATION_ERROR_CODES.VALIDATION);
  });

  it("creates ACTIVE paper consent", async () => {
    const tx = {
      appUser: { findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }) },
      appSetting: {
        findUnique: vi.fn().mockResolvedValue({ value: "v1" }),
      },
      $queryRaw: vi.fn().mockResolvedValue([{ id: pupilId }]),
      pupil: {
        findFirst: vi.fn().mockResolvedValue({ id: pupilId, isActive: true }),
      },
      childDataConsent: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null),
        create: vi.fn().mockResolvedValue({ id: consentId }),
        update: vi.fn(),
      },
      auditLog: { create: vi.fn().mockResolvedValue(undefined) },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await recordPaperConsent(db as never, actorUserId, {
      pupilId,
      signerName: "Мария Иванова",
      signedOn: "2026-01-01",
      textVersion: "v1",
      storageNote: "шкаф 2",
    });

    expect(result).toEqual({ ok: true, data: { consentId } });
    expect(tx.childDataConsent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: CONSENT_STATUS.ACTIVE,
          channel: CONSENT_CHANNEL.PAPER,
          signerName: "Мария Иванова",
        }),
      }),
    );
  });
});

describe("revokeConsent and enrollment", () => {
  it("blocks enrollment after revoke when no consent remains", async () => {
    const tx = {
      appUser: { findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }) },
      childDataConsent: {
        findUnique: vi.fn().mockResolvedValue({
          id: consentId,
          pupilId,
          status: CONSENT_STATUS.ACTIVE,
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      pupil: {
        findFirst: vi.fn().mockResolvedValue({ id: pupilId, isActive: true }),
      },
      auditLog: { create: vi.fn().mockResolvedValue(undefined) },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const revoked = await revokeConsent(db as never, actorUserId, {
      consentId,
      reason: "parent request",
    });
    expect(revoked).toEqual({ ok: true });

    const enrollError = canEnroll({
      today: "2026-06-01",
      consentStatus: null,
      legacyConsentDeadlineOn: null,
      hasActiveEnrollment: false,
      isGroupActive: true,
      yearStatus: ACADEMIC_YEAR_STATUS.ACTIVE,
    });
    expect(enrollError?.code).toBe(MUTATION_ERROR_CODES.SCHOOL_CONSENT_REQUIRED);
  });
});

describe("teacher consent view", () => {
  it("exposes only hasConsent without signer details", () => {
    expect(toTeacherPupilConsentView(CONSENT_STATUS.ACTIVE, "2026-06-01", null)).toEqual({
      hasConsent: true,
    });
    expect(toTeacherPupilConsentView(null, "2026-06-01", null)).toEqual({ hasConsent: false });
    expect(Object.keys(toTeacherPupilConsentView(CONSENT_STATUS.ACTIVE, "2026-06-01", null))).toEqual([
      "hasConsent",
    ]);
  });
});

describe("audit actions", () => {
  it("uses school consent audit codes", () => {
    expect(AUDIT_ACTION.SCHOOL_CONSENT_RECORDED).toBe("school.consent_recorded");
    expect(AUDIT_ACTION.SCHOOL_PUPIL_CREATED).toBe("school.pupil_created");
  });
});
