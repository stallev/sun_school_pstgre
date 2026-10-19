import { beforeEach, describe, expect, it, vi } from "vitest";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { revalidateBricksCaches } from "./revalidate-bricks-cache";

const updateTag = vi.fn();

vi.mock("next/cache", () => ({
  updateTag: (...args: unknown[]) => updateTag(...args),
}));

describe("revalidateBricksCaches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates bricks and pupil-years analytics tags", () => {
    const pupilId = "66666666-6666-4666-8666-666666666666";
    const yearId = "55555555-5555-4555-8555-555555555555";

    revalidateBricksCaches(pupilId, yearId);

    expect(updateTag).toHaveBeenCalledWith(CACHE_TAGS.bricksBalance(pupilId, yearId));
    expect(updateTag).toHaveBeenCalledWith(CACHE_TAGS.bricksLedger(pupilId, yearId));
    expect(updateTag).toHaveBeenCalledWith(CACHE_TAGS.analyticsPupilYears(pupilId));
  });
});
