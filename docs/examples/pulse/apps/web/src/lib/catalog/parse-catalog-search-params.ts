import {
  parseCatalogTrainersQuery,
  type CatalogTrainersQuery,
} from "@pulse/domain";

type RawSearchParams = Record<string, string | string[] | undefined>;

function readParam(
  raw: RawSearchParams,
  key: string,
): string | string[] | undefined {
  return raw[key];
}

function readStringArray(raw: RawSearchParams, key: string): string[] {
  const value = readParam(raw, key);
  if (value === undefined) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function normalizeRawSearchParams(raw: RawSearchParams): Record<string, unknown> {
  const maxPriceRaw = readParam(raw, "maxPrice");
  const maxPriceCents =
    maxPriceRaw === undefined || maxPriceRaw === ""
      ? undefined
      : Number(maxPriceRaw) * 100;

  return {
    q: readParam(raw, "q") ?? "",
    maxPriceCents,
    minRating: readParam(raw, "minRating"),
    specializations: readStringArray(raw, "specializations"),
    sort: readParam(raw, "sort"),
    page: readParam(raw, "page"),
    pageSize: readParam(raw, "pageSize"),
  };
}

export function parseCatalogSearchParams(
  raw: RawSearchParams,
): CatalogTrainersQuery {
  return parseCatalogTrainersQuery(normalizeRawSearchParams(raw));
}

export function hasActiveCatalogFilters(query: CatalogTrainersQuery): boolean {
  return (
    query.q.length > 0 ||
    query.maxPriceCents !== undefined ||
    query.minRating !== undefined ||
    query.specializations.length > 0
  );
}
