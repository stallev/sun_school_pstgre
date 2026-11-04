import { APP_LOCALE, type AppLocale } from "@sunschool/domain";

const fill = (template: string, values: Record<string, string | number>): string =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, String(value)),
    template,
  );

const normalizeTitle = (value: string): string => value.trim().toLowerCase();

export type LessonSubtitleTemplates = {
  withDate: string;
  withTitle: string;
  ordinalOnly: string;
};

export const isDefaultLessonTitle = (
  title: string,
  ordinal: number,
  locale: AppLocale,
  ordinalShortTemplate: string,
): boolean => {
  const trimmed = title.trim();
  const normalized = normalizeTitle(trimmed);
  const shortOrdinal = fill(ordinalShortTemplate, { n: ordinal });
  if (normalizeTitle(shortOrdinal) === normalized) {
    return true;
  }
  if (locale === APP_LOCALE.EN) {
    return normalized === `lesson ${ordinal}`;
  }
  return normalized === `урок ${ordinal}`;
};

export const formatLessonDisplaySubtitle = (
  ordinal: number,
  title: string,
  dateLabel: string | null | undefined,
  locale: AppLocale,
  templates: LessonSubtitleTemplates,
  ordinalShortTemplate: string,
): string => {
  if (isDefaultLessonTitle(title, ordinal, locale, ordinalShortTemplate)) {
    const date = dateLabel?.trim();
    if (date) {
      return fill(templates.withDate, { n: ordinal, date });
    }
    return fill(templates.ordinalOnly, { n: ordinal });
  }
  return fill(templates.withTitle, { n: ordinal, title: title.trim() });
};

export const formatLessonListRowTitle = (
  ordinal: number,
  title: string,
  locale: AppLocale,
  templates: Pick<LessonSubtitleTemplates, "withTitle" | "ordinalOnly">,
  ordinalShortTemplate: string,
): string =>
  formatLessonDisplaySubtitle(ordinal, title, null, locale, {
    ...templates,
    withDate: templates.ordinalOnly,
  }, ordinalShortTemplate);
