import {
  CATALOG_SORT,
  DEFAULT_CATALOG_PAGE_SIZE,
  type CatalogTrainersQuery,
} from "@pulse/domain";

export function buildCatalogSearchParams(
  query: CatalogTrainersQuery,
  patch: Partial<CatalogTrainersQuery> = {},
): URLSearchParams {
  const next: CatalogTrainersQuery = { ...query, ...patch };
  const params = new URLSearchParams();

  if (next.q.trim()) {
    params.set("q", next.q.trim());
  }

  if (next.maxPriceCents !== undefined) {
    params.set("maxPrice", String(Math.round(next.maxPriceCents / 100)));
  }

  if (next.minRating !== undefined) {
    params.set("minRating", String(next.minRating));
  }

  for (const slug of next.specializations) {
    params.append("specializations", slug);
  }

  if (next.sort !== CATALOG_SORT.RATING) {
    params.set("sort", next.sort);
  }

  if (next.page !== 1) {
    params.set("page", String(next.page));
  }

  if (next.pageSize !== DEFAULT_CATALOG_PAGE_SIZE) {
    params.set("pageSize", String(next.pageSize));
  }

  return params;
}

export function buildCatalogHref(
  query: CatalogTrainersQuery,
  patch: Partial<CatalogTrainersQuery> = {},
): string {
  const params = buildCatalogSearchParams(query, patch);
  const search = params.toString();
  return search ? `/trainers?${search}` : "/trainers";
}
