import "server-only";

import { updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { YearSnapshotCacheTargets } from "./create-year-snapshots";

export type YearSnapshotCacheScope = {
  organizationId: string;
  yearIds: readonly string[];
};

export function revalidateYearSnapshotCaches(
  targets: YearSnapshotCacheTargets,
  scope: YearSnapshotCacheScope,
): void {
  for (const gradeId of targets.gradeIds) {
    updateTag(CACHE_TAGS.analyticsYears(gradeId));
  }
  for (const pupilId of targets.pupilIds) {
    updateTag(CACHE_TAGS.analyticsPupilYears(pupilId));
  }
  for (const yearId of scope.yearIds) {
    updateTag(CACHE_TAGS.analyticsSchool(scope.organizationId, yearId));
  }
}
