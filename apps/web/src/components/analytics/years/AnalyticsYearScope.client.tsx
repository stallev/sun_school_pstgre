"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useMemo,
  useOptimistic,
  useTransition,
  type ReactNode,
} from "react";

type AnalyticsYearScopeValue = {
  visibleYearId: string;
  yearDetailPending: boolean;
  startYearChange: (yearId: string, href: string) => void;
};

const AnalyticsYearScopeContext = createContext<AnalyticsYearScopeValue | null>(null);

type AnalyticsYearScopeProps = {
  committedYearId: string;
  children: ReactNode;
};

export const AnalyticsYearScope = ({ committedYearId, children }: AnalyticsYearScopeProps) => {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [visibleYearId, setVisibleYearId] = useOptimistic(committedYearId);

  const value = useMemo<AnalyticsYearScopeValue>(() => {
    const startYearChange = (yearId: string, href: string) => {
      if (yearId === visibleYearId) return;
      startTransition(() => {
        setVisibleYearId(yearId);
        router.push(href, { scroll: false });
      });
    };
    return {
      visibleYearId,
      yearDetailPending: visibleYearId !== committedYearId,
      startYearChange,
    };
  }, [committedYearId, router, setVisibleYearId, visibleYearId]);

  return <AnalyticsYearScopeContext.Provider value={value}>{children}</AnalyticsYearScopeContext.Provider>;
};

export const useAnalyticsYearScope = (): AnalyticsYearScopeValue => {
  const value = useContext(AnalyticsYearScopeContext);
  if (!value) {
    throw new Error("useAnalyticsYearScope requires AnalyticsYearScope");
  }
  return value;
};
