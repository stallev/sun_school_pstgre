"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useOptimistic } from "react";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";
import { buildPupilYearNavSearchParams } from "./build-pupil-year-nav-query";
import { useAnalyticsYearScope } from "./AnalyticsYearScope.client";
import { useAnalyticsYearPush } from "./use-analytics-year-push";
import { buildPupilYearTableRows } from "./build-pupil-year-table-rows";
import type { PupilYearRow } from "@/data/analytics/years/list-pupil-year-rows";
import { PUPIL_YEAR_METRICS, PupilYearsSection, type PupilYearMetric } from "./PupilYearsSection";

type PupilAnalyticsYearNavProps = {
  pupilYearRows: readonly PupilYearRow[];
  selectedYearId: string;
  selectedMetric: PupilYearMetric;
  showForeignGroupNote: boolean;
  messages: AnalyticsMessages;
};

export const PupilAnalyticsYearNav = ({
  pupilYearRows,
  selectedYearId,
  selectedMetric,
  showForeignGroupNote,
  messages,
}: PupilAnalyticsYearNavProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tableRows = buildPupilYearTableRows(pupilYearRows);
  const yearHrefs = pupilYearRows.map((row) => {
    const params = buildPupilYearNavSearchParams(searchParams, { pupilYear: row.yearId }, true);
    return `${pathname}?${params.toString()}`;
  });
  const metricHrefs = PUPIL_YEAR_METRICS.map((metric) => {
    const params = buildPupilYearNavSearchParams(searchParams, { metric }, false);
    return `${pathname}?${params.toString()}`;
  });
  const { visibleYearId, yearDetailPending, startYearChange } = useAnalyticsYearScope();
  const { isPending, pushHref } = useAnalyticsYearPush([...yearHrefs, ...metricHrefs], selectedYearId);
  const [chosenMetric, setChosenMetric] = useOptimistic(selectedMetric);

  const pushMetric = (metric: PupilYearMetric) => {
    const params = buildPupilYearNavSearchParams(searchParams, { metric }, false);
    pushHref(`${pathname}?${params.toString()}`, undefined, () => {
      setChosenMetric(metric);
    });
  };

  const handleSelectYear = (yearId: string) => {
    const href = yearHrefs[pupilYearRows.findIndex((row) => row.yearId === yearId)];
    if (href) startYearChange(yearId, href);
  };

  return (
    <PupilYearsSection
      rows={tableRows}
      selectedYearId={visibleYearId}
      selectedMetric={chosenMetric}
      showForeignGroupNote={showForeignGroupNote}
      onSelectYear={handleSelectYear}
      onSelectMetric={pushMetric}
      isYearPending={yearDetailPending}
      isMetricPending={isPending}
      messages={messages}
      pupilYearMessages={messages.pupilYears}
      yearStripMessages={messages.years}
    />
  );
};
