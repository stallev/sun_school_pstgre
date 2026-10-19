import "server-only";

import type { Dictionary } from "@/lib/messages/get-dictionary";
import { getMessage } from "@/lib/messages/get-dictionary";
import type { TeacherRosterMessages } from "@/lib/messages/teacher-messages";

const fill = (template: string, values: Record<string, string | number>): string =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, String(value)),
    template,
  );

export const pickTeacherRosterMessages = (teacher: Dictionary): TeacherRosterMessages => ({
  selectAll: getMessage(teacher, "group.select_all"),
  selectPupil: (name) => fill(getMessage(teacher, "group.select_pupil"), { name }),
  removeSelected: (count) => fill(getMessage(teacher, "group.remove_selected"), { count }),
  enrolledSince: (isoDate) => fill(getMessage(teacher, "group.enrolled_since"), { date: isoDate }),
  consentYes: getMessage(teacher, "group.consent_yes"),
  consentNo: getMessage(teacher, "group.consent_no"),
  consentNoLegacy: getMessage(teacher, "group.consent_no_legacy"),
  addPupilLabel: getMessage(teacher, "group.add_pupil_label"),
  addPupilPlaceholder: getMessage(teacher, "group.add_pupil_placeholder"),
  addPupilSubmit: getMessage(teacher, "group.add_pupil_submit"),
  unenrollHint: getMessage(teacher, "group.unenroll_hint"),
  toastEnrolled: getMessage(teacher, "group.toast_enrolled"),
  toastUnenrolled: getMessage(teacher, "group.toast_unenrolled"),
  emptyTitle: getMessage(teacher, "group.empty_title"),
  emptyDescription: getMessage(teacher, "group.empty_description"),
  unassignedTitle: getMessage(teacher, "group.unassigned_title"),
  unassignedDescription: getMessage(teacher, "group.unassigned_description"),
  noYearTitle: getMessage(teacher, "group.no_year_title"),
  noYearDescription: getMessage(teacher, "group.no_year_description"),
  yearClosedTitle: getMessage(teacher, "group.year_closed_title"),
  yearClosedDescription: getMessage(teacher, "group.year_closed_description"),
  pageTitle: getMessage(teacher, "group.page_title"),
  pageSubtitle: (groupName, count) =>
    fill(getMessage(teacher, "group.page_subtitle"), { group: groupName, count }),
});
