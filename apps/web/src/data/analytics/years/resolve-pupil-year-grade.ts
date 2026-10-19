export type ResolvePupilYearAnalyticsGradeInput = {
  isAdmin: boolean;
  yearGradeIds: readonly string[];
  enrollmentGradeIdsOrdered: readonly string[];
  teacherAssignedGradeIds: readonly string[];
  requestedGradeId?: string;
};

export type ResolvePupilYearAnalyticsGradeResult =
  | { mode: "analytics"; gradeId: string }
  | { mode: "foreign_snapshot_only" };

/** AZ-50 — analytics grade for the selected pupil year, not the pupil's last enrollment. */
export function resolvePupilYearAnalyticsGrade(
  input: ResolvePupilYearAnalyticsGradeInput,
): ResolvePupilYearAnalyticsGradeResult {
  const { isAdmin, yearGradeIds, enrollmentGradeIdsOrdered, teacherAssignedGradeIds, requestedGradeId } =
    input;

  if (isAdmin) {
    const adminCandidates =
      enrollmentGradeIdsOrdered.length > 0 ? enrollmentGradeIdsOrdered : yearGradeIds;
    if (requestedGradeId && adminCandidates.includes(requestedGradeId)) {
      return { mode: "analytics", gradeId: requestedGradeId };
    }
    const fallback = adminCandidates[adminCandidates.length - 1];
    if (fallback) return { mode: "analytics", gradeId: fallback };
    return { mode: "foreign_snapshot_only" };
  }

  const assigned = new Set(teacherAssignedGradeIds);
  const assignedInEnrollmentOrder = enrollmentGradeIdsOrdered.filter((gradeId) => assigned.has(gradeId));

  if (requestedGradeId && assigned.has(requestedGradeId)) {
    return { mode: "analytics", gradeId: requestedGradeId };
  }
  if (assignedInEnrollmentOrder.length > 0) {
    return {
      mode: "analytics",
      gradeId: assignedInEnrollmentOrder[assignedInEnrollmentOrder.length - 1]!,
    };
  }

  return { mode: "foreign_snapshot_only" };
}

export type PupilYearRowGradeRef = {
  yearId: string;
  gradeIds: readonly string[];
};

/** Grade id for «back to group analytics» — never a foreign group (AZ-50). */
export function resolveBackToGroupGradeId(
  rows: readonly PupilYearRowGradeRef[],
  teacherAssignedByYear: ReadonlyMap<string, readonly string[]>,
): string | null {
  for (const row of rows) {
    const assigned = teacherAssignedByYear.get(row.yearId) ?? [];
    const match = row.gradeIds.find((gradeId) => assigned.includes(gradeId));
    if (match) return match;
  }
  return null;
}
