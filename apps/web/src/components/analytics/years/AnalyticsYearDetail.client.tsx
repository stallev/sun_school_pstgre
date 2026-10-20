"use client";

import type { ReactNode } from "react";
import { AnalyticsYearDetailSkeleton } from "./AnalyticsYearDetailSkeleton";
import { useAnalyticsYearScope } from "./AnalyticsYearScope.client";

type AnalyticsYearDetailProps = {
  pendingLabel: string;
  children: ReactNode;
};

export const AnalyticsYearDetail = ({ pendingLabel, children }: AnalyticsYearDetailProps) => {
  const { yearDetailPending } = useAnalyticsYearScope();
  if (!yearDetailPending) return children;
  return (
    <div aria-busy="true">
      <p className="sr-only">{pendingLabel}</p>
      <AnalyticsYearDetailSkeleton />
    </div>
  );
};
