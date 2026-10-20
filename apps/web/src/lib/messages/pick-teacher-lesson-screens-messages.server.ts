import "server-only";

import { APP_LOCALE, type AppLocale } from "@sunschool/domain";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { getMessage } from "@/lib/messages/get-dictionary";
import type { MessageLocale } from "@/lib/messages/dictionary-types";
import { formatPlural } from "@/lib/messages/plural";
import type { TeacherLessonScreensMessages } from "@/lib/messages/teacher-lesson-screens-messages";

const fill = (template: string, values: Record<string, string | number>): string =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, String(value)),
    template,
  );

const appLocaleToMessageLocale = (locale: AppLocale): MessageLocale =>
  locale === APP_LOCALE.EN ? "en" : "ru";

export const pickTeacherLessonScreensMessages = (
  teacher: Dictionary,
  locale: AppLocale,
): TeacherLessonScreensMessages => {
  const messageLocale = appLocaleToMessageLocale(locale);

  return {
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
  listOrdinalShort: (ordinal) =>
    fill(getMessage(teacher, "lesson.list.ordinal_short"), { n: ordinal }),
  listCheckFraction: (checked, total) =>
    fill(getMessage(teacher, "lesson.list.check_fraction"), { checked, total }),
  listReviewBadge: getMessage(teacher, "lesson.list.review_badge"),
  listReviewSubline: getMessage(teacher, "lesson.list.review_subline"),
  emptyVersesTitle: getMessage(teacher, "lesson.verses_page.empty_title"),
  emptyVersesDescription: getMessage(teacher, "lesson.verses_page.empty_description"),
  lessonCardTitle: (ordinal, title) =>
    fill(getMessage(teacher, "lesson.detail.card_title"), { n: ordinal, title }),
  lessonMetaLine: (ordinal, dateLabel, leadName) =>
    fill(getMessage(teacher, "lesson.detail.meta_line"), {
      n: ordinal,
      date: dateLabel,
      lead: leadName,
    }),
  checkSectionTitle: getMessage(teacher, "lesson.detail.check_section_title"),
  actionContinueCheck: getMessage(teacher, "lesson.detail.action_continue_check"),
  actionStartCheck: getMessage(teacher, "lesson.detail.action_start_check"),
  actionSummaryTable: getMessage(teacher, "lesson.detail.action_summary_table"),
  assignedVersesTitle: getMessage(teacher, "lesson.detail.assigned_verses_title"),
  assignedVersesHintNext: (nextOrdinal) =>
    fill(getMessage(teacher, "lesson.detail.assigned_verses_hint_next"), { n: nextOrdinal }),
  assignedVersesHintNextFallback: getMessage(
    teacher,
    "lesson.detail.assigned_verses_hint_next_fallback",
  ),
  recitingVersesTitle: getMessage(teacher, "lesson.detail.reciting_verses_title"),
  recitingVersesHintPrev: (previousOrdinal) =>
    fill(getMessage(teacher, "lesson.detail.reciting_verses_hint_prev"), { n: previousOrdinal }),
  reviewSectionTitle: getMessage(teacher, "lesson.detail.review_section_title"),
  reviewSectionDescription: getMessage(teacher, "lesson.detail.review_section_description"),
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
  todayGreeting: (name, part) => {
    const key =
      part === "morning"
        ? "lesson.today.greeting_morning"
        : part === "afternoon"
          ? "lesson.today.greeting_afternoon"
          : "lesson.today.greeting_evening";
    return fill(getMessage(teacher, key), { name });
  },
  todayIncompleteLabel: getMessage(teacher, "lesson.today.incomplete_label"),
  todayContinueCheck: getMessage(teacher, "lesson.today.continue_check"),
  todayCheckedStudentsLabel: getMessage(teacher, "lesson.today.checked_students_label"),
  todayProgressStub: getMessage(teacher, "lesson.today.progress_stub"),
  todayWeekTitle: getMessage(teacher, "lesson.today.week_title"),
  todayWeekNextLesson: getMessage(teacher, "lesson.today.week_next_lesson"),
  todayWeekNextLessonValue: (date, ordinal, title) =>
    fill(getMessage(teacher, "lesson.today.week_next_lesson_value"), {
      date,
      n: ordinal,
      title,
    }),
  todayWeekLate: getMessage(teacher, "lesson.today.week_late"),
  todayWeekLateValue: (pupilName, lessonDate) =>
    fill(getMessage(teacher, "lesson.today.week_late_value"), {
      pupil: pupilName,
      date: lessonDate,
    }),
  todayWeekBricks: getMessage(teacher, "lesson.today.week_bricks"),
  todayWeekBricksValue: (count) =>
    formatPlural(
      {
        one: getMessage(teacher, "lesson.today.week_bricks_value_one"),
        few: getMessage(teacher, "lesson.today.week_bricks_value_few"),
        many: getMessage(teacher, "lesson.today.week_bricks_value_many"),
        other: getMessage(teacher, "lesson.today.week_bricks_value_many"),
      },
      count,
      messageLocale,
    ),
  todayWeekBricksNegativeHint: getMessage(teacher, "lesson.today.week_bricks_negative_hint"),
  todayWeekOpen: (label) => fill(getMessage(teacher, "lesson.today.week_open"), { label }),
  locale,
};
};
