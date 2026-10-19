import { beforeEach, describe, expect, it, vi } from "vitest";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { revalidateYearSnapshotCaches } from "./revalidate-year-snapshot-cache";

const updateTag = vi.fn();

vi.mock("next/cache", () => ({
  updateTag: (...args: unknown[]) => updateTag(...args),
}));

describe("revalidateYearSnapshotCaches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates analytics years, pupil-years, and school tags on snapshot versioning", () => {
    const organizationId = "22222222-2222-4222-8222-222222222222";
    const yearId = "55555555-5555-4555-8555-555555555555";
    const gradeId = "44444444-4444-4444-8444-444444444444";
    const pupilId = "66666666-6666-4666-8666-666666666666";

    revalidateYearSnapshotCaches(
      { gradeIds: [gradeId], pupilIds: [pupilId] },
      { organizationId, yearIds: [yearId] },
    );

    expect(updateTag).toHaveBeenCalledWith(CACHE_TAGS.analyticsYears(gradeId));
    expect(updateTag).toHaveBeenCalledWith(CACHE_TAGS.analyticsPupilYears(pupilId));
    expect(updateTag).toHaveBeenCalledWith(CACHE_TAGS.analyticsSchool(organizationId, yearId));
  });
});
