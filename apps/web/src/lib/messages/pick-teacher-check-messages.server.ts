import "server-only";

import type { Dictionary } from "@/lib/messages/get-dictionary";
import { getMessage } from "@/lib/messages/get-dictionary";
import type { TeacherCheckMessages } from "@/lib/messages/teacher-check-messages";

const fill = (template: string, values: Record<string, string | number>): string =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, String(value)),
    template,
  );

export const pickTeacherCheckMessages = (
  teacher: Dictionary,
  common: Dictionary,
): TeacherCheckMessages => ({
  pageTitleCheck: getMessage(teacher, "check.page_title"),
  pageTitleCorrection: getMessage(teacher, "check.page_title_correction"),
  lessonSubtitle: (ordinal, title) =>
    fill(getMessage(teacher, "check.lesson_subtitle"), { ordinal, title }),
  linkTable: getMessage(teacher, "check.link_table"),
  linkLesson: getMessage(teacher, "lesson.form.back_lesson"),
  correctionBanner: getMessage(teacher, "check.correction_banner"),
  progressLabel: (checked, total) =>
    fill(getMessage(teacher, "check.progress"), { checked, total }),
  pupilsToggle: (checked, total) =>
    fill(getMessage(teacher, "check.pupils_toggle"), { checked, total }),
  pupilIndex: (index, total) =>
    fill(getMessage(teacher, "check.pupil_index"), { index, total }),
  birthYear: (year) => fill(getMessage(teacher, "check.birth_year"), { year }),
  birthYearUnknown: getMessage(teacher, "check.birth_year_unknown"),
  pointsLabel: getMessage(teacher, "check.points_label"),
  presentLabel: getMessage(teacher, "check.present_label"),
  presentYes: getMessage(teacher, "check.present_yes"),
  presentNo: getMessage(teacher, "check.present_no"),
  presentHint: getMessage(teacher, "check.present_hint"),
  singingLabel: getMessage(teacher, "check.singing_label"),
  reviewHint: getMessage(teacher, "check.review_hint"),
  versesIntro: (lessonOrdinal) =>
    fill(getMessage(teacher, "check.verses_intro"), { lessonOrdinal }),
  noVersesFirstLesson: getMessage(teacher, "check.no_verses_first_lesson"),
  noTestOnLesson: getMessage(teacher, "check.no_test_on_lesson"),
  verseLabel: (position) => fill(getMessage(teacher, "check.verse_label"), { position }),
  testLabel: getMessage(teacher, "check.test_label"),
  notebookLabel: getMessage(teacher, "check.notebook_label"),
  commentPlaceholder: getMessage(teacher, "check.comment_placeholder"),
  reasonLabel: getMessage(teacher, "check.reason_label"),
  reasonLate: getMessage(teacher, "check.reason_late"),
  reasonInputError: getMessage(teacher, "check.reason_input_error"),
  reasonOther: getMessage(teacher, "check.reason_other"),
  scoreNotRated: getMessage(teacher, "check.score_not_rated"),
  lateSubmitted: getMessage(teacher, "check.late_submitted"),
  unsavedIndicator: getMessage(teacher, "check.unsaved_indicator"),
  unsavedConfirmTitle: getMessage(teacher, "check.unsaved_confirm_title"),
  unsavedConfirmSave: getMessage(teacher, "check.unsaved_confirm_save"),
  unsavedConfirmDiscard: getMessage(teacher, "check.unsaved_confirm_discard"),
  unsavedConfirmCancel: getMessage(teacher, "lesson.form.cancel"),
  previousPupil: getMessage(teacher, "check.previous_pupil"),
  nextPupil: getMessage(teacher, "check.next_pupil"),
  keyboardHint: getMessage(teacher, "check.keyboard_hint"),
  saveNext: getMessage(teacher, "check.save_next"),
  completeCheck: getMessage(teacher, "check.complete"),
  saveCorrection: getMessage(teacher, "check.save_correction"),
  savedToast: (name) => fill(getMessage(teacher, "check.saved_toast"), { name }),
  conflictTitle: getMessage(teacher, "check.conflict_title"),
  conflictReload: getMessage(teacher, "check.conflict_reload"),
  finishedTitle: getMessage(teacher, "check.finished_title"),
  finishedSubtitle: (ordinal, title, total) =>
    fill(getMessage(teacher, "check.finished_subtitle"), { ordinal, title, total }),
  finishedProgress: (checked, total) =>
    fill(getMessage(teacher, "check.finished_progress"), { checked, total }),
  linkBricks: getMessage(teacher, "check.link_bricks"),
  emptyRosterTitle: getMessage(teacher, "check.empty_roster_title"),
  emptyRosterDescription: getMessage(teacher, "check.empty_roster_description"),
  emptyRosterAction: getMessage(teacher, "check.empty_roster_action"),
  yearClosedTitle: getMessage(teacher, "group.year_closed_title"),
  yearClosedDescription: getMessage(teacher, "group.year_closed_description"),
  pendingSave: getMessage(teacher, "lesson.form.saving"),
  formError: getMessage(common, "errors.form"),
  tablePageTitle: getMessage(teacher, "check.table.page_title"),
  tableLinkSequential: getMessage(teacher, "check.table.link_sequential"),
  tableFilterPresent: getMessage(teacher, "check.table.filter_present"),
  tableFilterUnchecked: getMessage(teacher, "check.table.filter_unchecked"),
  tableLegendUnchecked: getMessage(teacher, "check.table.legend_unchecked"),
  tableLegendAbsent: getMessage(teacher, "check.table.legend_absent"),
  tableColumnNumber: getMessage(teacher, "check.table.column_number"),
  tableColumnPupil: getMessage(teacher, "check.table.column_pupil"),
  tableColumnOpen: getMessage(teacher, "check.table.column_open"),
  tableFootnote: getMessage(teacher, "check.table.footnote"),
  tableNoTest: getMessage(teacher, "check.table.no_test"),
  tableVersesMobile: getMessage(teacher, "check.table.verses_mobile"),
  tableOpenPupilAria: (name) =>
    fill(getMessage(teacher, "check.table.open_pupil_aria"), { name }),
  tableProgressHeader: (checked, total) =>
    fill(getMessage(teacher, "check.table.progress_header"), { checked, total }),
});
