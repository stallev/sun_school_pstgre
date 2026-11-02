import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@sunschool/db";

vi.mock("server-only", () => ({}));

const readFeaturesParentsEnabled = vi.fn();
const readFeaturesAchievementsEnabled = vi.fn();
const loadParentChildOptions = vi.fn();
const assertParentCanViewChildData = vi.fn();
const loadParentPendingSuggestions = vi.fn();

vi.mock("./family-feature.server", () => ({
  readFeaturesParentsEnabled: (...a: unknown[]) => readFeaturesParentsEnabled(...a),
}));
vi.mock("../achievements/achievement-feature.server", () => ({
  readFeaturesAchievementsEnabled: (...a: unknown[]) => readFeaturesAchievementsEnabled(...a),
}));
vi.mock("./parent-child-access.server", () => ({
  loadParentChildOptions: (...a: unknown[]) => loadParentChildOptions(...a),
  assertParentCanViewChildData: (...a: unknown[]) => assertParentCanViewChildData(...a),
  resolveParentSelectedPupilId: (
    children: { pupilId: string }[],
    preferred: string | null,
    fallback: string,
  ) => (preferred ? (children.some((c) => c.pupilId === preferred) ? preferred : null) : fallback),
}));
vi.mock("../access/access-admin-guards.server", () => ({
  isMutationErr: (r: { ok?: boolean }) => r.ok === false,
}));
vi.mock("../access/get-organization-id.server", () => ({
  getDefaultOrganizationId: vi.fn().mockResolvedValue("org"),
}));
vi.mock("../analytics/get-pupil-analytics", () => ({
  getPupilAnalytics: vi.fn().mockResolvedValue({ ok: false }),
}));
vi.mock("../analytics/pupil-analytics-present.server", () => ({ buildPupilAnalyticsView: vi.fn() }));
vi.mock("../bricks/bricks-shared.server", () => ({
  loadBricksBalanceInTransaction: vi.fn().mockResolvedValue({ earned: 0, issued: 0, balance: 0 }),
}));
vi.mock("../achievements/load-pupil-achievement-panel.server", () => ({
  loadPupilAchievementPanel: vi.fn().mockResolvedValue({ kind: "hidden" }),
}));
vi.mock("./ensure-weekly-digest", () => ({
  ensureWeeklyDigest: vi.fn().mockResolvedValue({ ok: false }),
}));
vi.mock("./load-parent-pending-suggestions.server", () => ({
  loadParentPendingSuggestions: (...a: unknown[]) => loadParentPendingSuggestions(...a),
}));

import { loadParentChildPage } from "./load-parent-child-page.server";

const ownChild = { pupilId: "p1", displayName: "A", gradeName: "G", hasElectronicConsent: true };

function makeDb() {
  const db = {
    $transaction: (fn: (tx: unknown) => unknown) => fn({}),
    academicYear: {
      findFirst: vi.fn().mockResolvedValue({
        id: "y1",
        name: "2026",
        startsOn: new Date("2026-09-01"),
        endsOn: new Date("2027-05-31"),
      }),
    },
    enrollment: {
      findFirst: vi.fn().mockResolvedValue({
        gradeId: "g1",
        pupil: { lastName: "L", firstName: "F", middleName: null },
        grade: { name: "G" },
      }),
    },
  };
  return db as unknown as PrismaClient;
}

function setup(achievementsOn: boolean) {
  readFeaturesParentsEnabled.mockResolvedValue(true);
  readFeaturesAchievementsEnabled.mockResolvedValue(achievementsOn);
  loadParentChildOptions.mockResolvedValue([ownChild]);
  assertParentCanViewChildData.mockResolvedValue({ ok: true });
  loadParentPendingSuggestions.mockReset();
  loadParentPendingSuggestions.mockResolvedValue([{ suggestionId: "s1" }]);
}

const call = (db: PrismaClient, pupil: string | null = null) =>
  loadParentChildPage(db, "u1", pupil, "ru", "UTC", "tpl");

describe("loadParentChildPage pendingSuggestions", () => {
  it("passes suggestions through for a consented own child, scoped to the active year", async () => {
    setup(true);
    const result = await call(makeDb());
    expect(result.kind).toBe("page");
    if (result.kind === "page") expect(result.pendingSuggestions).toEqual([{ suggestionId: "s1" }]);
    expect(loadParentPendingSuggestions.mock.calls[0]![1]).toMatchObject({
      pupilId: "p1",
      academicYearId: "y1",
      achievementsEnabled: true,
    });
  });

  it("passes the features.achievements flag down so the loader hides suggestions when off", async () => {
    setup(false);
    await call(makeDb());
    expect(loadParentPendingSuggestions.mock.calls[0]![1]).toMatchObject({ achievementsEnabled: false });
  });

  it("hides data without consent (no suggestions loaded)", async () => {
    setup(true);
    assertParentCanViewChildData.mockResolvedValue({ ok: false });
    expect((await call(makeDb())).kind).toBe("no_consent");
    expect(loadParentPendingSuggestions).not.toHaveBeenCalled();
  });

  it("returns not_found for a foreign child", async () => {
    setup(true);
    expect((await call(makeDb(), "foreign")).kind).toBe("not_found");
    expect(loadParentPendingSuggestions).not.toHaveBeenCalled();
  });

  it("returns flag_off when features.parents is off", async () => {
    setup(true);
    readFeaturesParentsEnabled.mockResolvedValue(false);
    expect((await call(makeDb())).kind).toBe("flag_off");
    expect(loadParentPendingSuggestions).not.toHaveBeenCalled();
  });
});
