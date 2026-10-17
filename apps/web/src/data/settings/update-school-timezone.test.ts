import { beforeEach, describe, expect, it, vi } from "vitest";
import { AUDIT_ACTION, MUTATION_ERROR_CODES, USER_ROLE } from "@sunschool/domain";
import { updateSchoolTimezone } from "./update-school-timezone";

vi.mock("next/cache", () => ({
  updateTag: vi.fn(),
}));

vi.mock("@sunschool/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sunschool/db")>();
  return { ...actual, writeAudit: vi.fn() };
});

const actorUserId = "55555555-5555-4555-8555-555555555555";
const orgId = "33333333-3333-4333-8333-333333333333";

describe("updateSchoolTimezone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns VALIDATION for unknown IANA zone (ADR-004 §7 N)", async () => {
    const tx = {
      appUser: {
        findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
      },
      userRoleAssignment: {
        findFirst: vi.fn().mockResolvedValue({ id: "role-1", role: USER_ROLE.ADMIN }),
      },
      appSetting: { findUnique: vi.fn(), upsert: vi.fn() },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await updateSchoolTimezone(db as never, actorUserId, {
      timeZone: "Not/A_Zone",
    });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.VALIDATION,
      message: "admin.settings.timezone_invalid",
    });
    expect(tx.appSetting.upsert).not.toHaveBeenCalled();
  });

  it("only updates app_setting when timezone changes — no backfill (ADR-004 §4.7)", async () => {
    const zones = Intl.supportedValuesOf("timeZone");
    const nextZone = zones.find((zone) => zone !== "UTC") ?? zones[0]!;
    const tx = {
      appUser: {
        findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
      },
      userRoleAssignment: {
        findFirst: vi.fn().mockResolvedValue({ id: "role-1", role: USER_ROLE.ADMIN }),
      },
      appSetting: {
        findUnique: vi.fn().mockResolvedValue({ value: "UTC" }),
        upsert: vi.fn().mockResolvedValue({}),
      },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await updateSchoolTimezone(db as never, actorUserId, {
      timeZone: nextZone,
    });

    expect(result).toEqual({ ok: true });
    expect(tx.appSetting.upsert).toHaveBeenCalledOnce();
    expect(Object.keys(tx)).toEqual(["appUser", "userRoleAssignment", "appSetting"]);
    const { writeAudit } = await import("@sunschool/db");
    expect(writeAudit).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: AUDIT_ACTION.SETTINGS_TIMEZONE_CHANGED,
        entityId: "school_timezone",
        newValue: { timeZone: nextZone },
      }),
    );
  });
});
