import { beforeEach, describe, expect, it, vi } from "vitest";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { revalidateAnalyticsForGradeYear } from "./revalidate-analytics-cache";

const updateTag = vi.fn();

vi.mock("next/cache", () => ({
  updateTag: (...args: unknown[]) => updateTag(...args),
}));

describe("revalidateAnalyticsForGradeYear", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates group, conducted, data-quality and deleted-data tags", () => {
    const gradeId = "44444444-4444-4444-8444-444444444444";
    const yearId = "55555555-5555-4555-8555-555555555555";

    revalidateAnalyticsForGradeYear(gradeId, yearId);

    expect(updateTag).toHaveBeenCalledWith(CACHE_TAGS.analyticsGroup(gradeId, yearId));
    expect(updateTag).toHaveBeenCalledWith(CACHE_TAGS.analyticsConducted(gradeId, yearId));
    expect(updateTag).toHaveBeenCalledWith(CACHE_TAGS.analyticsDataQuality(gradeId, yearId));
    expect(updateTag).toHaveBeenCalledWith(CACHE_TAGS.analyticsDeletedData(gradeId, yearId));
  });
});
