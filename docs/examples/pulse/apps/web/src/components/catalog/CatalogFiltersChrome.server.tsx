import type { CatalogTrainersQuery } from "@pulse/domain";

import { CatalogFilterSidebar } from "@/components/catalog/filters/CatalogFilterSidebar.client";
import { getCatalogFilterOptions } from "@/data/catalog/get-catalog-filter-options.server";
import { getCatalogFilterSidebarKey } from "@/lib/catalog/catalog-filter-draft";

export type CatalogFiltersChromeProps = {
  query: CatalogTrainersQuery;
};

/** Desktop filter sidebar — sibling Suspense to the results column. */
export async function CatalogFiltersChrome({ query }: CatalogFiltersChromeProps) {
  const filterOptions = await getCatalogFilterOptions();

  return (
    <CatalogFilterSidebar
      key={getCatalogFilterSidebarKey(query)}
      query={query}
      options={filterOptions}
    />
  );
}
