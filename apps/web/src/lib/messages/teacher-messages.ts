/** Serializable teacher-route copy passed to client roster UI. */
export type TeacherRosterMessages = {
  selectAll: string;
  selectPupil: (name: string) => string;
  removeSelected: (count: number) => string;
  enrolledSince: (isoDate: string) => string;
  consentYes: string;
  consentNo: string;
  consentNoLegacy: string;
  addPupilLabel: string;
  addPupilPlaceholder: string;
  addPupilSubmit: string;
  unenrollHint: string;
  toastEnrolled: string;
  toastUnenrolled: string;
  emptyTitle: string;
  emptyDescription: string;
  unassignedTitle: string;
  unassignedDescription: string;
  noYearTitle: string;
  noYearDescription: string;
  yearClosedTitle: string;
  yearClosedDescription: string;
  pageTitle: string;
  pageSubtitle: (groupName: string, count: number) => string;
};
