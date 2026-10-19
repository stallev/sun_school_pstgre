"use client";

import { ACADEMIC_YEAR_STATUS } from "@sunschool/domain";
import { useRouter, useSearchParams } from "next/navigation";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";
import { YearStrip } from "./YearStrip";
import { YearTotalsTable, type YearTotalsTableRow } from "./YearTotalsTable";

type GroupAnalyticsYearNavProps = {
  groupLabel: string;
  tableRows: readonly YearTotalsTableRow[];
  selectedYearId: string;
  messages: AnalyticsMessages;
};

export const GroupAnalyticsYearNav = ({
  groupLabel,
  tableRows,
  selectedYearId,
  messages,
}: GroupAnalyticsYearNavProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const yearMessages = messages.years;

  const handleSelectYear = (yearId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", yearId);
    router.push(`/analytics?${params.toString()}`);
  };

  const stripYears = tableRows.map((row) => ({
    id: row.yearId,
    name: row.yearName,
    isActive: row.status === ACADEMIC_YEAR_STATUS.ACTIVE,
  }));

  return (
    <>
      <YearStrip
        years={stripYears}
        selectedYearId={selectedYearId}
        onSelectYear={handleSelectYear}
        messages={yearMessages}
      />
      <YearTotalsTable
        groupLabel={groupLabel}
        rows={tableRows}
        selectedYearId={selectedYearId}
        onSelectYear={handleSelectYear}
        messages={messages}
        yearMessages={yearMessages}
      />
    </>
  );
};
