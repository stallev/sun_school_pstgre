import { describe, expect, it, vi } from "vitest";

const findMany = vi.fn();

vi.mock("@/lib/db.server", () => ({
  getPrisma: async () => ({ appSetting: { findMany } }),
}));

import { readProductFeatureFlags } from "./read-product-feature-flags.server";

describe("readProductFeatureFlags", () => {
  it("loads both feature flags in one findMany", async () => {
    findMany.mockResolvedValue([
      { key: "features.achievements", value: true },
      { key: "features.parents", value: false },
    ]);
    const db = await import("@/lib/db.server").then((m) => m.getPrisma());
    const flags = await readProductFeatureFlags(db);
    expect(findMany).toHaveBeenCalledOnce();
    expect(flags).toEqual({ achievementsEnabled: true, parentsEnabled: false });
  });
});
