import { ChevronRightIcon } from "lucide-react";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/custom-link";
import { fillMessage } from "@/lib/messages/fill-message";
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
    <section className="mb-6 space-y-4" aria-labelledby="group-year-summary-title">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <SectionTitle as="h2" id="group-year-summary-title">
          {fillMessage(messages.groupYear.sectionTitle, { year: yearRow.yearName })}
        </SectionTitle>
        <Button
          type="button"
          variant="outline"
          size="compact"
          className="min-h-11"
          render={<CustomLink href={analyticsHref} />}
        >
          {yearMessages.allYearsLink}
          <ChevronRightIcon aria-hidden />
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
