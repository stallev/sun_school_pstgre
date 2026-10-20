import { SectionTitle } from "@/components/atoms/SectionTitle";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/custom-link";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";
import type { YearTotalsTableRow } from "./YearTotalsTable";
import { KpiTiles } from "./KpiTiles";

type GroupYearSummarySectionProps = {
  yearRow: YearTotalsTableRow;
  analyticsHref: string;
  messages: AnalyticsMessages;
};

export const GroupYearSummarySection = ({
  yearRow,
  analyticsHref,
  messages,
}: GroupYearSummarySectionProps) => {
  if (!yearRow.totals) return null;

  const yearMessages = messages.years;

  return (
    <section className="space-y-4" aria-labelledby="group-year-summary-title">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <SectionTitle as="h2" id="group-year-summary-title">
          {messages.groupYear.sectionTitle(yearRow.yearName)}
        </SectionTitle>
        <Button type="button" variant="outline" className="min-h-11" render={<CustomLink href={analyticsHref} />}>
          {yearMessages.allYearsLink}
        </Button>
      </div>
      <KpiTiles
        totals={yearRow.totals}
        diff={yearRow.diff}
        hasPreviousYear={yearRow.hasPreviousYear}
        comparisonReliable={yearRow.comparisonReliable}
        previousYearName={yearRow.previousYearName}
        messages={messages}
        yearMessages={yearMessages}
      />
    </section>
  );
};
