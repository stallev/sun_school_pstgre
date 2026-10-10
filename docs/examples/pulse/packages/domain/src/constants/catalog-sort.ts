export const CATALOG_SORT = {
  RATING: "rating",
  NEWEST: "newest",
  PRICE: "price",
} as const;

export const CATALOG_SORTS = [
  CATALOG_SORT.RATING,
  CATALOG_SORT.NEWEST,
  CATALOG_SORT.PRICE,
] as const;

export type CatalogSort = (typeof CATALOG_SORTS)[number];

export const CATALOG_MIN_RATINGS = [3, 4, 4.5] as const;

export type CatalogMinRating = (typeof CATALOG_MIN_RATINGS)[number];

export const DEFAULT_CATALOG_PAGE_SIZE = 12;

export const MAX_CATALOG_PAGE_SIZE = 24;
