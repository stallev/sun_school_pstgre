import type { CatalogTrainersQuery } from "@pulse/domain";

import { CatalogActiveFilterChips } from "@/components/catalog/filters/CatalogActiveFilterChips.client";
import { CatalogFilterSheet } from "@/components/catalog/filters/CatalogFilterSheet.client";
import { CatalogSearchInput } from "@/components/catalog/filters/CatalogSearchInput.client";
import { getCatalogFilterOptions } from "@/data/catalog/get-catalog-filter-options.server";

export type CatalogResultsToolbarProps = {
  query: CatalogTrainersQuery;
};

/** Search + mobile filter sheet + chips — streams independently of the grid. */
export async function CatalogResultsToolbar({ query }: CatalogResultsToolbarProps) {
  const filterOptions = await getCatalogFilterOptions();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <CatalogSearchInput query={query} className="flex-1" />
        <CatalogFilterSheet query={query} options={filterOptions} />
      </div>

      <CatalogActiveFilterChips
        query={query}
        options={filterOptions}
        className="-mx-4 px-4"
      />
    </div>
  );
}
