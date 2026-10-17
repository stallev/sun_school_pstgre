import { beforeEach, describe, expect, it, vi } from "vitest";
import { AUDIT_ACTION, MUTATION_ERROR_CODES, USER_ROLE } from "@sunschool/domain";
import { updateAppLanguage } from "./update-app-language";

vi.mock("next/cache", () => ({
  updateTag: vi.fn(),
}));

vi.mock("@sunschool/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sunschool/db")>();
  return { ...actual, writeAudit: vi.fn() };
});

const actorUserId = "55555555-5555-4555-8555-555555555555";
const orgId = "33333333-3333-4333-8333-333333333333";

describe("updateAppLanguage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns FORBIDDEN when actor is not admin (ADR-008 §7 S)", async () => {
    const tx = {
      appUser: {
        findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
      },
      userRoleAssignment: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      appSetting: { findUnique: vi.fn(), upsert: vi.fn() },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await updateAppLanguage(db as never, actorUserId, { locale: "en" });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.FORBIDDEN,
      message: "common.errors.forbidden",
    });
    expect(tx.appSetting.upsert).not.toHaveBeenCalled();
  });

  it("returns VALIDATION for unknown locale (ADR-008 §7 N)", async () => {
    const db = {
      $transaction: vi.fn(),
    };

    const result = await updateAppLanguage(db as never, actorUserId, { locale: "fr" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe(MUTATION_ERROR_CODES.VALIDATION);
      expect(result.fields?.locale).toBeDefined();
    }
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("updates ui_locale and audits settings.language_changed", async () => {
    const tx = {
      appUser: {
        findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }),
      },
      userRoleAssignment: {
        findFirst: vi.fn().mockResolvedValue({ id: "role-1", role: USER_ROLE.ADMIN }),
      },
      appSetting: {
        findUnique: vi.fn().mockResolvedValue({ value: "ru" }),
        upsert: vi.fn().mockResolvedValue({}),
      },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await updateAppLanguage(db as never, actorUserId, { locale: "en" });

    expect(result).toEqual({ ok: true });
    expect(tx.appSetting.upsert).toHaveBeenCalledWith({
      where: { key: "ui_locale" },
      create: { key: "ui_locale", value: "en" },
      update: { value: "en" },
    });
    const { writeAudit } = await import("@sunschool/db");
    expect(writeAudit).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: AUDIT_ACTION.SETTINGS_LANGUAGE_CHANGED,
        entityId: "ui_locale",
        newValue: { locale: "en" },
      }),
    );
  });
});
