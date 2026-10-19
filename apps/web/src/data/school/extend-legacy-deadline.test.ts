import { describe, expect, it, vi } from "vitest";
import { AUDIT_ACTION, MUTATION_ERROR_CODES } from "@sunschool/domain";
import { extendLegacyDeadline } from "./extend-legacy-deadline";

const actorUserId = "55555555-5555-4555-8555-555555555555";
const orgId = "33333333-3333-4333-8333-333333333333";

describe("extendLegacyDeadline", () => {
  it("returns FORBIDDEN when actor is not admin (ADR-011 §7 S)", async () => {
    const tx = {
      appUser: { findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }) },
      userRoleAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
      organization: { findUnique: vi.fn() },
      appSetting: { findUnique: vi.fn(), upsert: vi.fn() },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await extendLegacyDeadline(db as never, actorUserId, {
      newDeadlineOn: "2026-12-31",
      reason: "school council decision",
    });

    expect(result).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.FORBIDDEN,
      message: "common.errors.forbidden",
    });
    expect(tx.appSetting.upsert).not.toHaveBeenCalled();
  });

  it("rejects when transitional deadline is not configured", async () => {
    const tx = {
      appUser: { findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }) },
      userRoleAssignment: {
        findFirst: vi.fn().mockResolvedValue({ id: "role-1" }),
      },
      organization: { findUnique: vi.fn().mockResolvedValue({ id: orgId }) },
      appSetting: { findUnique: vi.fn().mockResolvedValue(null), upsert: vi.fn() },
      auditLog: { create: vi.fn() },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await extendLegacyDeadline(db as never, actorUserId, {
      newDeadlineOn: "2026-12-31",
      reason: "school council decision",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(MUTATION_ERROR_CODES.VALIDATION);
  });

  it("extends deadline and writes audit entry", async () => {
    const auditCreate = vi.fn().mockResolvedValue(undefined);
    const tx = {
      appUser: { findUnique: vi.fn().mockResolvedValue({ organizationId: orgId }) },
      userRoleAssignment: {
        findFirst: vi.fn().mockResolvedValue({ id: "role-1" }),
      },
      organization: { findUnique: vi.fn().mockResolvedValue({ id: orgId }) },
      appSetting: {
        findUnique: vi.fn().mockResolvedValue({ value: "2026-06-01" }),
        upsert: vi.fn().mockResolvedValue({}),
      },
      auditLog: { create: auditCreate },
    };
    const db = {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    const result = await extendLegacyDeadline(db as never, actorUserId, {
      newDeadlineOn: "2026-09-01",
      reason: "more time for guardians",
    });

    expect(result).toEqual({ ok: true, data: { deadlineOn: "2026-09-01" } });
    expect(tx.appSetting.upsert).toHaveBeenCalled();
    expect(auditCreate.mock.calls[0]?.[0]?.data?.action).toBe(
      AUDIT_ACTION.SCHOOL_LEGACY_DEADLINE_EXTENDED,
    );
  });
});
