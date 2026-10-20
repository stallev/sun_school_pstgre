"use client";

import { ACADEMIC_YEAR_STATUS, ANALYTICS_METHODOLOGY_VERSION } from "@sunschool/domain";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";
import { KpiTiles } from "./KpiTiles";
import { MethodologyVersionNote } from "./MethodologyVersionNote";
import { ReadOnlyYearNote } from "./ReadOnlyYearNote";
import { useAnalyticsYearScope } from "./AnalyticsYearScope.client";
import type { YearTotalsTableRow } from "./YearTotalsTable";

type GroupYearSelectionProps = {
  rows: readonly YearTotalsTableRow[];
  messages: AnalyticsMessages;
};

export const GroupYearSelection = ({ rows, messages }: GroupYearSelectionProps) => {
  const { visibleYearId } = useAnalyticsYearScope();
  const row = rows.find((item) => item.yearId === visibleYearId);
  if (!row) return null;

  const yearMessages = messages.years;
  const isActiveYear = row.status === ACADEMIC_YEAR_STATUS.ACTIVE;
  const showStaleMethodology = row.methodologyVersion !== ANALYTICS_METHODOLOGY_VERSION;

  return (
    <>
      {isActiveYear ? null : <ReadOnlyYearNote messages={yearMessages} />}
      {showStaleMethodology ? (
        <MethodologyVersionNote
          snapshotVersion={row.methodologyVersion}
          currentVersion={ANALYTICS_METHODOLOGY_VERSION}
          messages={yearMessages}
        />
      ) : null}
      {row.totals ? (
        <KpiTiles
          totals={row.totals}
          diff={row.diff}
          hasPreviousYear={row.hasPreviousYear}
          comparisonReliable={row.comparisonReliable}
          previousYearName={row.previousYearName}
          messages={messages}
          yearMessages={yearMessages}
        />
      ) : null}
    </>
  );
};
