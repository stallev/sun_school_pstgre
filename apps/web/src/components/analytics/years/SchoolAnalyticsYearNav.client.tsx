"use client";

import { ACADEMIC_YEAR_STATUS } from "@sunschool/domain";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";
import { useAnalyticsYearScope } from "./AnalyticsYearScope.client";
import { ReadOnlyYearNote } from "./ReadOnlyYearNote";
import { YearStrip } from "./YearStrip";

type SchoolYearStripItem = {
  id: string;
  name: string;
  status: string;
};

type SchoolAnalyticsYearNavProps = {
  years: readonly SchoolYearStripItem[];
  messages: AnalyticsMessages;
};

export const SchoolAnalyticsYearNav = ({ years, messages }: SchoolAnalyticsYearNavProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { visibleYearId, yearDetailPending, startYearChange } = useAnalyticsYearScope();
  const yearMessages = messages.years;
  const yearHrefs = years.map((year) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", year.id);
    return `/school?${params.toString()}`;
  });
  const hrefKey = yearHrefs.join("\n");

  useEffect(() => {
    for (const href of hrefKey.split("\n")) {
      if (href.length > 0) router.prefetch(href);
    }
  }, [hrefKey, router]);

  const handleSelectYear = (yearId: string) => {
    const href = yearHrefs[years.findIndex((year) => year.id === yearId)];
    if (href) startYearChange(yearId, href);
  };

  const stripYears = years.map((year) => ({
    id: year.id,
    name: year.name,
    isActive: year.status === ACADEMIC_YEAR_STATUS.ACTIVE,
  }));
  const selectedYear = years.find((year) => year.id === visibleYearId);

  return (
    <>
      <YearStrip
        years={stripYears}
        selectedYearId={visibleYearId}
        onSelectYear={handleSelectYear}
        messages={yearMessages}
        isPending={yearDetailPending}
      />
      {selectedYear?.status === ACADEMIC_YEAR_STATUS.CLOSED ? (
        <ReadOnlyYearNote messages={yearMessages} />
      ) : null}
    </>
  );
};
