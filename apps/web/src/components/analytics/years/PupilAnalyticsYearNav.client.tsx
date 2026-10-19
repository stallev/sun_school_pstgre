"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";
import { buildPupilYearNavSearchParams } from "./build-pupil-year-nav-query";
import { buildPupilYearTableRows } from "./build-pupil-year-table-rows";
import type { PupilYearRow } from "@/data/analytics/years/list-pupil-year-rows";
import {
  PupilYearsSection,
  type PupilYearMetric,
} from "./PupilYearsSection";

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tableRows = buildPupilYearTableRows(pupilYearRows);

  const pushQuery = (updates: Record<string, string>, resetPeriod = false) => {
    const params = buildPupilYearNavSearchParams(searchParams, updates, resetPeriod);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <PupilYearsSection
      rows={tableRows}
      selectedYearId={selectedYearId}
      selectedMetric={selectedMetric}
      showForeignGroupNote={showForeignGroupNote}
      onSelectYear={(yearId) => pushQuery({ pupilYear: yearId }, true)}
      onSelectMetric={(metric) => pushQuery({ metric })}
      messages={messages}
      pupilYearMessages={messages.pupilYears}
      yearStripMessages={messages.years}
    />
  );
};
