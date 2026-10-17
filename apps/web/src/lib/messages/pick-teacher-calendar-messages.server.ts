import "server-only";

import type { AppLocale } from "@sunschool/domain";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { getMessage } from "@/lib/messages/get-dictionary";
import type { TeacherCalendarMessages } from "@/lib/messages/teacher-calendar-messages";

const fill = (template: string, values: Record<string, string | number>): string =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, String(value)),
    template,
  );

export const pickTeacherCalendarMessages = (
  teacher: Dictionary,
  locale: AppLocale,
): TeacherCalendarMessages => ({
  pageTitle: getMessage(teacher, "calendar.page_title"),
  pageSubtitle: (group, year) =>
    fill(getMessage(teacher, "calendar.page_subtitle"), { group, year }),
  newEvent: getMessage(teacher, "calendar.new_event"),
  monthEventsTitle: getMessage(teacher, "calendar.month_events_title"),
  emptyMonth: getMessage(teacher, "calendar.empty_month"),
  emptyMonthCta: getMessage(teacher, "calendar.empty_month_cta"),
  typeLesson: getMessage(teacher, "calendar.type_lesson"),
  typeTrip: getMessage(teacher, "calendar.type_trip"),
  typeCancellation: getMessage(teacher, "calendar.type_cancellation"),
  weekdays: [
    getMessage(teacher, "calendar.weekday_mon"),
    getMessage(teacher, "calendar.weekday_tue"),
    getMessage(teacher, "calendar.weekday_wed"),
    getMessage(teacher, "calendar.weekday_thu"),
    getMessage(teacher, "calendar.weekday_fri"),
    getMessage(teacher, "calendar.weekday_sat"),
    getMessage(teacher, "calendar.weekday_sun"),
  ],
  prevMonth: getMessage(teacher, "calendar.prev_month"),
  nextMonth: getMessage(teacher, "calendar.next_month"),
  openLesson: getMessage(teacher, "calendar.open_lesson"),
  formCreateTitle: getMessage(teacher, "calendar.form_create_title"),
  formEditTitle: getMessage(teacher, "calendar.form_edit_title"),
  dateLabel: getMessage(teacher, "calendar.date_label"),
  typeLabel: getMessage(teacher, "calendar.type_label"),
  titleLabel: getMessage(teacher, "calendar.title_label"),
  descriptionLabel: getMessage(teacher, "calendar.description_label"),
  lessonLinkLabel: getMessage(teacher, "calendar.lesson_link_label"),
  lessonLinkNone: getMessage(teacher, "calendar.lesson_link_none"),
  save: getMessage(teacher, "calendar.save"),
  delete: getMessage(teacher, "calendar.delete"),
  cancel: getMessage(teacher, "calendar.cancel"),
  deleteConfirmTitle: getMessage(teacher, "calendar.delete_confirm_title"),
  deleteConfirmDescription: getMessage(teacher, "calendar.delete_confirm_description"),
  toastCreated: getMessage(teacher, "calendar.toast_created"),
  toastUpdated: getMessage(teacher, "calendar.toast_updated"),
  toastDeleted: getMessage(teacher, "calendar.toast_deleted"),
  locale,
});
