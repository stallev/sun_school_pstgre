import "server-only";

import type { Dictionary } from "@/lib/messages/get-dictionary";
import { getMessage } from "@/lib/messages/get-dictionary";
import type { TeacherRosterMessages } from "@/lib/messages/teacher-messages";

export const pickTeacherRosterMessages = (teacher: Dictionary): TeacherRosterMessages => ({
  selectAll: getMessage(teacher, "group.select_all"),
  selectPupil: getMessage(teacher, "group.select_pupil"),
  removeSelected: getMessage(teacher, "group.remove_selected"),
  enrolledSince: getMessage(teacher, "group.enrolled_since"),
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
  pageSubtitle: getMessage(teacher, "group.page_subtitle"),
  birthDateButton: getMessage(teacher, "group.birth_date.button"),
  birthDateDialogTitle: getMessage(teacher, "group.birth_date.dialog_title"),
  birthDateDialogDescription: getMessage(teacher, "group.birth_date.dialog_description"),
  birthDateLabel: getMessage(teacher, "group.birth_date.label"),
  birthDateSubmit: getMessage(teacher, "group.birth_date.submit"),
  birthDateSaving: getMessage(teacher, "group.birth_date.saving"),
  birthDateToastSaved: getMessage(teacher, "group.birth_date.toast_saved"),
});
