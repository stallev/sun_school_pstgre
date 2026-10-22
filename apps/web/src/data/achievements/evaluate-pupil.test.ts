import { describe, expect, it, vi } from "vitest";
import { evaluatePupilInTransaction } from "./evaluate-pupil";

describe("evaluatePupilInTransaction", () => {
  it("returns no awards when the feature flag is off", async () => {
    const tx = {
      appSetting: { findUnique: vi.fn().mockResolvedValue({ value: false }) },
    };

    const result = await evaluatePupilInTransaction(
      tx as never,
      "actor",
      "pupil",
      "year",
      "grade",
    );
    expect(result).toEqual({ awardIds: [] });
  });
});
