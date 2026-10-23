import { beforeEach, describe, expect, it, vi } from "vitest";
import { MUTATION_ERROR_CODES, USER_ROLE } from "@sunschool/domain";

const actorUserId = "55555555-5555-4555-8555-555555555555";
const foreignPupilId = "88888888-8888-4888-8888-888888888888";

const mockRequireRole = vi.fn();
const mockGetPrisma = vi.fn();
const mockLoadActorOrganizationId = vi.fn();
const mockAssertAwardManuallyAccess = vi.fn();
const mockLoadManualAwardEvidence = vi.fn();
const mockGetUiLocale = vi.fn();
const mockGetSchoolTimezone = vi.fn();

vi.mock("@/lib/auth/require-user", () => ({
  requireRole: (...args: unknown[]) => mockRequireRole(...args),
}));

vi.mock("@/lib/db.server", () => ({
  getPrisma: () => mockGetPrisma(),
}));

vi.mock("@/data/school/school-pupil-shared.server", () => ({
  loadActorOrganizationId: (...args: unknown[]) => mockLoadActorOrganizationId(...args),
}));

vi.mock("@/data/achievements/achievement-mutate-access.server", () => ({
  assertAwardManuallyAccess: (...args: unknown[]) => mockAssertAwardManuallyAccess(...args),
}));

vi.mock("@/data/achievements/load-manual-award-form.server", () => ({
  loadManualAwardEvidence: (...args: unknown[]) => mockLoadManualAwardEvidence(...args),
}));

vi.mock("@/lib/i18n/get-ui-locale.server", () => ({
  getUiLocale: () => mockGetUiLocale(),
}));

vi.mock("@/lib/i18n/get-school-timezone.server", () => ({
  getSchoolTimezone: () => mockGetSchoolTimezone(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const { loadManualAwardEvidenceAction } = await import("./teacher-achievements");

describe("loadManualAwardEvidenceAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireRole.mockResolvedValue({ userId: actorUserId, roles: [USER_ROLE.TEACHER] });
    mockGetUiLocale.mockResolvedValue("ru");
    mockGetSchoolTimezone.mockResolvedValue("Europe/Moscow");
    mockLoadManualAwardEvidence.mockResolvedValue({ need: 2, options: [] });
  });

  it("returns NOT_FOUND when teacher cannot access pupil (AZ-D4 IDOR)", async () => {
    const tx = {};
    mockGetPrisma.mockResolvedValue({
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    });
    mockLoadActorOrganizationId.mockResolvedValue("33333333-3333-4333-8333-333333333333");
    mockAssertAwardManuallyAccess.mockResolvedValue({
      ok: false,
      code: MUTATION_ERROR_CODES.NOT_FOUND,
      message: "common.errors.not_found",
    });

    const result = await loadManualAwardEvidenceAction({
      pupilId: foreignPupilId,
      achievementId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      tier: 1,
      academicYearId: "66666666-6666-4666-8666-666666666666",
    });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.NOT_FOUND,
      message: "common.errors.not_found",
    });
    expect(mockAssertAwardManuallyAccess).toHaveBeenCalledWith(
      tx,
      actorUserId,
      "33333333-3333-4333-8333-333333333333",
      foreignPupilId,
    );
    expect(mockLoadManualAwardEvidence).not.toHaveBeenCalled();
  });

  it("loads evidence when access is allowed", async () => {
    const tx = {};
    mockGetPrisma.mockResolvedValue({
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    });
    mockLoadActorOrganizationId.mockResolvedValue("33333333-3333-4333-8333-333333333333");
    mockAssertAwardManuallyAccess.mockResolvedValue(null);
    const evidencePayload = {
      need: 1,
      options: [{ checkId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", label: "L1", suggested: true }],
    };
    mockLoadManualAwardEvidence.mockResolvedValue(evidencePayload);

    const result = await loadManualAwardEvidenceAction({
      pupilId: "77777777-7777-4777-8777-777777777777",
      achievementId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      tier: 1,
      academicYearId: "66666666-6666-4666-8666-666666666666",
    });

    expect(result).toEqual({ ok: true, data: evidencePayload });
    expect(mockLoadManualAwardEvidence).toHaveBeenCalledOnce();
  });
});
