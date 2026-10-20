"use client";

import { ACADEMIC_YEAR_STATUS } from "@sunschool/domain";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";
import { useAnalyticsYearScope } from "./AnalyticsYearScope.client";
import { YearStrip } from "./YearStrip";
import { YearTotalsTable, type YearTotalsTableRow } from "./YearTotalsTable";

type GroupAnalyticsYearNavProps = {
  groupLabel: string;
  tableRows: readonly YearTotalsTableRow[];
  messages: AnalyticsMessages;
};

export const GroupAnalyticsYearNav = ({
  groupLabel,
  tableRows,
  messages,
}: GroupAnalyticsYearNavProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { visibleYearId, yearDetailPending, startYearChange } = useAnalyticsYearScope();
  const yearMessages = messages.years;
  const yearHrefs = tableRows.map((row) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", row.yearId);
    return `/analytics?${params.toString()}`;
  });
  const hrefKey = yearHrefs.join("\n");

  useEffect(() => {
    for (const href of hrefKey.split("\n")) {
      if (href.length > 0) router.prefetch(href);
    }
  }, [hrefKey, router]);

  const handleSelectYear = (yearId: string) => {
    const href = yearHrefs[tableRows.findIndex((row) => row.yearId === yearId)];
    if (href) startYearChange(yearId, href);
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
        selectedYearId={visibleYearId}
        onSelectYear={handleSelectYear}
        messages={yearMessages}
        isPending={yearDetailPending}
      />
      <YearTotalsTable
        groupLabel={groupLabel}
        rows={tableRows}
        selectedYearId={visibleYearId}
        onSelectYear={handleSelectYear}
        messages={messages}
        yearMessages={yearMessages}
      />
    </>
  );
};
