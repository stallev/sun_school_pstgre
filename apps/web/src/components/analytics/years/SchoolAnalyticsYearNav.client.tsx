"use client";

import { ACADEMIC_YEAR_STATUS } from "@sunschool/domain";
import { useRouter, useSearchParams } from "next/navigation";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";
import { YearStrip } from "./YearStrip";

type SchoolAnalyticsYearNavProps = {
  years: readonly { id: string; name: string; status: string }[];
  selectedYearId: string;
  messages: AnalyticsMessages;
};

export const SchoolAnalyticsYearNav = ({
  years,
  selectedYearId,
  messages,
}: SchoolAnalyticsYearNavProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const yearMessages = messages.years;

  const handleSelectYear = (yearId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", yearId);
    router.push(`/school?${params.toString()}`);
  };

  const stripYears = years.map((year) => ({
    id: year.id,
    name: year.name,
    isActive: year.status === ACADEMIC_YEAR_STATUS.ACTIVE,
  }));

  return (
    <YearStrip
      years={stripYears}
      selectedYearId={selectedYearId}
      onSelectYear={handleSelectYear}
      messages={yearMessages}
    />
  );
};
