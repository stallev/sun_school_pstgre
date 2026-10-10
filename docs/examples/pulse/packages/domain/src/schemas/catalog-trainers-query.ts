import { z } from "zod";

import {
  CATALOG_MIN_RATINGS,
  CATALOG_SORT,
  CATALOG_SORTS,
  DEFAULT_CATALOG_PAGE_SIZE,
  MAX_CATALOG_PAGE_SIZE,
} from "../constants/catalog-sort";
import { isSpecializationSlug } from "../constants/specialization-slugs";

const catalogSortSchema = z.enum(CATALOG_SORTS);

const catalogMinRatingSchema = z.coerce
  .number()
  .refine(
    (value): value is (typeof CATALOG_MIN_RATINGS)[number] =>
      CATALOG_MIN_RATINGS.includes(value as (typeof CATALOG_MIN_RATINGS)[number]),
    { message: "Invalid minRating" },
  );

export const catalogTrainersQuerySchema = z.object({
  q: z.string().trim().max(120).default(""),
  maxPriceCents: z.coerce.number().int().min(0).optional(),
  minRating: catalogMinRatingSchema.optional(),
  specializations: z
    .array(z.string())
    .default([])
    .transform((values) => values.filter(isSpecializationSlug)),
  sort: catalogSortSchema.default(CATALOG_SORT.RATING),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_CATALOG_PAGE_SIZE)
    .default(DEFAULT_CATALOG_PAGE_SIZE),
});

export type CatalogTrainersQuery = z.infer<typeof catalogTrainersQuerySchema>;

export const defaultCatalogTrainersQuery: CatalogTrainersQuery =
  catalogTrainersQuerySchema.parse({});

export function parseCatalogTrainersQuery(
  input: unknown,
): CatalogTrainersQuery {
  const parsed = catalogTrainersQuerySchema.safeParse(input);
  return parsed.success ? parsed.data : defaultCatalogTrainersQuery;
}
