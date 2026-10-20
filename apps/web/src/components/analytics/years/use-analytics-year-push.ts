"use client";

import { useRouter } from "next/navigation";
import { useEffect, useOptimistic, useTransition } from "react";

/**
 * Same-route analytics navigation. Prefetch targets and push inside a transition
 * so the previous view stays mounted. `useOptimistic` paints the chosen year in
 * that same transition, before the RSC payload arrives.
 */
export const useAnalyticsYearPush = (hrefs: readonly string[], committedYearId: string) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedYearId, setSelectedYearId] = useOptimistic(committedYearId);

  const hrefKey = hrefs.join("\n");

  useEffect(() => {
    for (const href of hrefKey.split("\n")) {
      if (href.length > 0) router.prefetch(href);
    }
  }, [hrefKey, router]);

  const pushHref = (href: string, yearId?: string, applyOptimistic?: () => void) => {
    startTransition(() => {
      if (yearId) setSelectedYearId(yearId);
      applyOptimistic?.();
      router.push(href, { scroll: false });
    });
  };

  return { isPending, selectedYearId, pushHref };
};
