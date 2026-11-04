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
