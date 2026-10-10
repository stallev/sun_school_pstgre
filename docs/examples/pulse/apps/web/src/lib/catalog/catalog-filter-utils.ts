import type { CatalogTrainersQuery } from "@pulse/domain";

import { hasActiveCatalogFilters } from "@/lib/catalog/parse-catalog-search-params";
import type { AppLocale } from "@/lib/i18n/constants";
import type { Messages } from "@/lib/messages/types";

export function countActiveCatalogFilters(query: CatalogTrainersQuery): number {
  let count = 0;

  if (query.q.trim()) {
    count += 1;
  }

  if (query.maxPriceCents !== undefined) {
    count += 1;
  }

  if (query.minRating !== undefined) {
    count += 1;
  }

  count += query.specializations.length;

  return count;
}

function getRussianTrainerCountTemplate(
  count: number,
  messages: Messages,
): string {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return messages.catalog.resultsCountOne;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return messages.catalog.resultsCountFew;
  }

  return messages.catalog.resultsCount;
}

export function formatCatalogResultsCount(
  count: number,
  messages: Messages,
  locale: AppLocale,
): string {
  const template =
    locale === "ru"
      ? getRussianTrainerCountTemplate(count, messages)
      : count === 1
        ? messages.catalog.resultsCountOne
        : messages.catalog.resultsCount;

  return template.replace("{count}", String(count));
}

export function getSpecializationName(
  slug: string,
  options: { slug: string; name: string }[],
): string {
  return options.find((item) => item.slug === slug)?.name ?? slug;
}

export { hasActiveCatalogFilters };
