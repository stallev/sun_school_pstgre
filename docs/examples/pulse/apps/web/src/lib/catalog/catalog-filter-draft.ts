import type { CatalogTrainersQuery } from "@pulse/domain";

export type CatalogFilterDraft = Pick<
  CatalogTrainersQuery,
  "maxPriceCents" | "minRating" | "specializations"
>;

export function pickCatalogFilterDraft(
  query: CatalogTrainersQuery,
): CatalogFilterDraft {
  return {
    maxPriceCents: query.maxPriceCents,
    minRating: query.minRating,
    specializations: query.specializations,
  };
}

export function getCatalogFilterSidebarKey(query: CatalogTrainersQuery): string {
  return [
    query.maxPriceCents ?? "",
    query.minRating ?? "",
    ...query.specializations,
  ].join("|");
}
