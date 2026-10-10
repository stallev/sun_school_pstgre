"use client";

import { useRouter } from "next/navigation";

import type { CatalogTrainersQuery } from "@pulse/domain";

import { ContentText } from "@/components/atoms";
import { FilterChip } from "@/components/ui/FilterChip";
import type { CatalogFilterOptions } from "@/data/catalog/get-catalog-filter-options.server";
import { buildCatalogHref } from "@/lib/catalog/build-catalog-search-params";
import {
  getSpecializationName,
  hasActiveCatalogFilters,
} from "@/lib/catalog/catalog-filter-utils";
import { useMessages } from "@/components/i18n/LocaleProvider.client";

import { cn } from "@/lib/utils";

export type CatalogActiveFilterChipsProps = {
  query: CatalogTrainersQuery;
  options: CatalogFilterOptions;
  className?: string;
};

export function CatalogActiveFilterChips({  query,
  options,
  className,
}: CatalogActiveFilterChipsProps) {
  const messages = useMessages();

  const router = useRouter();

  if (!hasActiveCatalogFilters(query)) {
    return null;
  }

  const clearAll = () => {
    router.push("/trainers");
  };

  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto pb-1 no-scrollbar lg:hidden",
        className,
      )}
    >
      {query.q.trim() ? (
        <FilterChip
          selected
          onClick={() => router.push(buildCatalogHref(query, { q: "", page: 1 }))}
        >
          «{query.q.trim()}»
        </FilterChip>
      ) : null}
      {query.maxPriceCents !== undefined ? (
        <FilterChip
          selected
          onClick={() =>
            router.push(buildCatalogHref(query, { maxPriceCents: undefined, page: 1 }))
          }
        >
          ≤ ${Math.round(query.maxPriceCents / 100)}
        </FilterChip>
      ) : null}
      {query.minRating !== undefined ? (
        <FilterChip
          selected
          onClick={() =>
            router.push(buildCatalogHref(query, { minRating: undefined, page: 1 }))
          }
        >
          {messages.catalog.ratingTier.replace("{value}", String(query.minRating))}
        </FilterChip>
      ) : null}
      {query.specializations.map((slug) => (
        <FilterChip
          key={slug}
          selected
          onClick={() =>
            router.push(
              buildCatalogHref(query, {
                specializations: query.specializations.filter((item) => item !== slug),
                page: 1,
              }),
            )
          }
        >
          {getSpecializationName(slug, options.specializations)}
        </FilterChip>
      ))}
      <button
        type="button"
        onClick={clearAll}
        className="inline-flex min-h-9 shrink-0 items-center px-2 text-[13px] font-medium text-primary"
      >
        <ContentText variant="smallEmphasis" as="span">
          {messages.catalog.clearAllFilters}
        </ContentText>
      </button>
    </div>
  );
}
