import "server-only";

import type { AppLocale } from "@sunschool/domain";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { getMessage } from "@/lib/messages/get-dictionary";
import type { TeacherLessonScreensMessages } from "@/lib/messages/teacher-lesson-screens-messages";

const fill = (template: string, values: Record<string, string | number>): string =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, String(value)),
    template,
  );

export const pickTeacherLessonScreensMessages = (
  teacher: Dictionary,
  locale: AppLocale,
): TeacherLessonScreensMessages => ({
  listTitle: getMessage(teacher, "lesson.list.title"),
  listSubtitle: (group, year) =>
    fill(getMessage(teacher, "lesson.list.subtitle"), { group, year }),
  versesPageTitle: getMessage(teacher, "lesson.verses_page.title"),
  versesPageSubtitle: (group, year) =>
    fill(getMessage(teacher, "lesson.verses_page.subtitle"), { group, year }),
  newLesson: getMessage(teacher, "lesson.list.new_lesson"),
  gradeFilterLabel: getMessage(teacher, "lesson.list.grade_filter"),
  gradeFilterApply: getMessage(teacher, "lesson.list.grade_apply"),
  emptyLessonsTitle: getMessage(teacher, "lesson.list.empty_title"),
  emptyLessonsDescription: getMessage(teacher, "lesson.list.empty_description"),
  emptyLessonsAction: getMessage(teacher, "lesson.list.empty_action"),
  emptyVersesTitle: getMessage(teacher, "lesson.verses_page.empty_title"),
  emptyVersesDescription: getMessage(teacher, "lesson.verses_page.empty_description"),
  lessonCardTitle: (ordinal, title) =>
    fill(getMessage(teacher, "lesson.detail.card_title"), { n: ordinal, title }),
  dateLabel: getMessage(teacher, "lesson.detail.date"),
  leadLabel: getMessage(teacher, "lesson.detail.lead"),
  kindRegular: getMessage(teacher, "lesson.form.kind_regular"),
  kindReview: getMessage(teacher, "lesson.form.kind_review"),
  hasTestYes: getMessage(teacher, "lesson.detail.has_test_yes"),
  hasTestNo: getMessage(teacher, "lesson.detail.has_test_no"),
  bodyTitle: getMessage(teacher, "lesson.detail.body"),
  versesTitle: getMessage(teacher, "lesson.form.verses_title"),
  versesEmpty: getMessage(teacher, "lesson.form.verses_empty"),
  verseMissing: getMessage(teacher, "lesson.detail.verse_missing"),
  checkProgressLabel: getMessage(teacher, "lesson.detail.check_progress"),
  checkNotStarted: getMessage(teacher, "lesson.detail.check_not_started"),
  checkPartial: (checked, total) =>
    fill(getMessage(teacher, "lesson.detail.check_partial"), { checked, total }),
  checkCompleted: getMessage(teacher, "lesson.detail.check_completed"),
  actionCheck: getMessage(teacher, "lesson.detail.action_check"),
  actionEdit: getMessage(teacher, "lesson.detail.action_edit"),
  actionDelete: getMessage(teacher, "lesson.detail.action_delete"),
  deleteConfirmTitle: getMessage(teacher, "lesson.detail.delete_confirm_title"),
  deleteConfirmDescription: getMessage(teacher, "lesson.detail.delete_confirm_description"),
  deleteConfirmAction: getMessage(teacher, "lesson.detail.delete_confirm_action"),
  deleteCancel: getMessage(teacher, "lesson.form.cancel"),
  toastDeleted: getMessage(teacher, "lesson.toast_deleted"),
  checkStubTitle: getMessage(teacher, "lesson.check_stub.title"),
  checkStubDescription: getMessage(teacher, "lesson.check_stub.description"),
  checkStubBack: getMessage(teacher, "lesson.form.back_lesson"),
  usedInLessons: getMessage(teacher, "lesson.verses_page.used_in"),
  lessonUsageLink: (ordinal, title) =>
    fill(getMessage(teacher, "lesson.verses_page.usage_link"), { n: ordinal, title }),
  unassignedTitle: getMessage(teacher, "group.unassigned_title"),
  unassignedDescription: getMessage(teacher, "group.unassigned_description"),
  yearClosedTitle: getMessage(teacher, "group.year_closed_title"),
  yearClosedDescription: getMessage(teacher, "group.year_closed_description"),
  todayPageSubtitle: (group, year) =>
    fill(getMessage(teacher, "lesson.today.page_subtitle"), { group, year }),
  todayIncompleteLabel: getMessage(teacher, "lesson.today.incomplete_label"),
  todayContinueCheck: getMessage(teacher, "lesson.today.continue_check"),
  todayProgressStub: getMessage(teacher, "lesson.today.progress_stub"),
  locale,
});
