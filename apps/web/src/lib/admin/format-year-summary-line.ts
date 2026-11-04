import { ACADEMIC_YEAR_STATUS, type AcademicYearStatus } from "@sunschool/domain";
import { fillMessage } from "@/lib/messages/fill-message";
import type { MessageLocale } from "@/lib/messages/dictionary-types";
import { formatPlural, type PluralForms } from "@/lib/messages/plural";

type FormatYearSummaryInput = {
  locale: MessageLocale;
  template: string;
  lessonCount: number;
  groupCount: number;
  pupilCount: number;
  lessonForms: PluralForms;
  groupForms: PluralForms;
  pupilForms: PluralForms;
};

export const formatYearSummaryLine = ({
  locale,
  template,
  lessonCount,
  groupCount,
  pupilCount,
  lessonForms,
  groupForms,
  pupilForms,
}: FormatYearSummaryInput): string =>
  fillMessage(template, {
    lessons: formatPlural(lessonForms, lessonCount, locale, { count: lessonCount }),
    groups: formatPlural(groupForms, groupCount, locale, { count: groupCount }),
    pupils: formatPlural(pupilForms, pupilCount, locale, { count: pupilCount }),
  });

type ResolveYearCardSummaryInput = FormatYearSummaryInput & {
  status: AcademicYearStatus;
  archiveSummary: string;
};

/** Closed year with no live enrollments — show archive copy instead of «0 групп · 0 учеников». */
export const resolveYearCardSummaryLine = ({
  status,
  archiveSummary,
  lessonCount,
  groupCount,
  pupilCount,
  ...rest
}: ResolveYearCardSummaryInput): string => {
  if (
    status === ACADEMIC_YEAR_STATUS.CLOSED &&
    lessonCount === 0 &&
    groupCount === 0 &&
    pupilCount === 0
  ) {
    return archiveSummary;
  }
  return formatYearSummaryLine({ ...rest, lessonCount, groupCount, pupilCount });
};
