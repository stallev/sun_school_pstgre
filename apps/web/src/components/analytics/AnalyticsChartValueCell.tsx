import { TermLabel, nonEmptyTerm } from "@/components/ui/term-label";
import { formatAnalyticsChartValue } from "@/lib/analytics/format-analytics-display";
import { plural } from "@/lib/i18n/format";
import { fillMessage } from "@/lib/messages/fill-message";
import type { AnalyticsChartPoint } from "@/data/analytics/analytics-compute.server";
import type { MessageLocale } from "@/lib/messages/dictionary-types";
import type { PluralForms } from "@/lib/messages/plural";
import type { HintTerm } from "@/lib/messages/pick-hints-messages";

type AnalyticsChartValueCellProps = {
  point: AnalyticsChartPoint;
  chartValueTemplate: string;
  emptyLabel: string;
  lessonsObservedForms: PluralForms;
  formatLocale: MessageLocale;
  averagedOverHint: HintTerm;
  termHintAriaLabel: string;
};

export const AnalyticsChartValueCell = ({
  point,
  chartValueTemplate,
  emptyLabel,
  lessonsObservedForms,
  formatLocale,
  averagedOverHint,
  termHintAriaLabel,
}: AnalyticsChartValueCellProps) => {
  if (point.value === null) return emptyLabel;

  const formattedValue = formatAnalyticsChartValue(
    chartValueTemplate,
    emptyLabel,
    point.value,
    point.observationCount,
    lessonsObservedForms,
    formatLocale,
  ).split(" · ")[0];

  const lessonsLabel = plural(lessonsObservedForms, point.observationCount, formatLocale);

  return (
    <span className="inline-flex flex-wrap items-center gap-x-1 gap-y-0.5">
      <span>{formattedValue}</span>
      <span aria-hidden>·</span>
      <TermLabel
        term={nonEmptyTerm(lessonsLabel)}
        hint={averagedOverHint.hint}
        ariaLabel={fillMessage(termHintAriaLabel, { term: lessonsLabel })}
      />
    </span>
  );
};
