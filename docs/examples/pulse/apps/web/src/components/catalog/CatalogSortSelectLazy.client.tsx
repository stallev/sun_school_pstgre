"use client";

import dynamic from "next/dynamic";

import type { CatalogSortSelectProps } from "@/components/catalog/filters/CatalogSortSelect.client";
import { Skeleton } from "@/components/ui/skeleton";

const CatalogSortSelect = dynamic(
  () =>
    import("@/components/catalog/filters/CatalogSortSelect.client").then(
      (module) => ({ default: module.CatalogSortSelect }),
    ),
  {
    loading: () => <Skeleton className="h-9 w-[140px] rounded-full" aria-hidden />,
  },
);

export function CatalogSortSelectLazy(props: CatalogSortSelectProps) {
  return <CatalogSortSelect {...props} />;
}
