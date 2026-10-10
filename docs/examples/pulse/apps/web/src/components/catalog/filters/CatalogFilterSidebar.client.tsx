"use client";

import type { CatalogTrainersQuery } from "@pulse/domain";

import { Heading } from "@/components/atoms";
import { PulseCard } from "@/components/ui/card";
import type { CatalogFilterOptions } from "@/data/catalog/get-catalog-filter-options.server";
import { useMessages } from "@/components/i18n/LocaleProvider.client";

import { cn } from "@/lib/utils";

import { CatalogFilterFields } from "./CatalogFilterFields.client";
import { useCatalogSidebarFilterDraft } from "./use-catalog-sidebar-filter-draft";

export type CatalogFilterSidebarProps = {
  query: CatalogTrainersQuery;
  options: CatalogFilterOptions;
  className?: string;
};

export function CatalogFilterSidebar({  query,
  options,
  className,
}: CatalogFilterSidebarProps) {
  const messages = useMessages();
  const { draft, handleDraftChange, handleClear } = useCatalogSidebarFilterDraft(query);

  return (
    <aside className={cn("hidden lg:block", className)}>
      <PulseCard variant="catalog" className="sticky top-24 space-y-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <Heading as="h2" visualLevel="h3" className="text-left">
            {messages.catalog.filtersTitle}
          </Heading>
          <button
            type="button"
            onClick={handleClear}
            className="text-[12px] font-medium text-primary transition-colors hover:text-primary/80"
          >
            {messages.catalog.clearFilters}
          </button>
        </div>
        <CatalogFilterFields
          draft={draft}
          options={options}
          onDraftChange={handleDraftChange}
        />
      </PulseCard>
    </aside>
  );
}
