import type { CatalogTrainersQuery } from "@pulse/domain";

import { ContentText } from "@/components/atoms";
import { TrainerCard } from "@/components/catalog/TrainerCard";
import { CatalogEmpty } from "@/components/catalog/CatalogEmpty";
import { CatalogPagination } from "@/components/catalog/filters/CatalogPagination.client";
import { CatalogSortSelect } from "@/components/catalog/filters/CatalogSortSelect.client";
import { getCatalogTrainers } from "@/data/catalog/get-catalog-trainers.server";
import { formatCatalogResultsCount } from "@/lib/catalog/catalog-filter-utils";
import { getLocale, getMessages } from "@/lib/messages/server";

export type CatalogTrainerGridProps = {
  query: CatalogTrainersQuery;
};

const ABOVE_FOLD_IMAGE_COUNT = 2;

export async function CatalogTrainerGrid({ query }: CatalogTrainerGridProps) {
  const locale = await getLocale();
  const messages = await getMessages();
  const result = await getCatalogTrainers(query);

  if (result.items.length === 0) {
    return <CatalogEmpty />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ContentText variant="muted" as="p">
          {formatCatalogResultsCount(
            result.pagination.totalCount,
            messages,
            locale,
          )}
        </ContentText>
        <CatalogSortSelect query={result.appliedQuery} />
      </div>

      <div className="grid grid-cols-1 items-stretch gap-2.5 lg:grid-cols-2">
        {result.items.map((trainer, index) => (
          <TrainerCard
            key={trainer.id}
            trainer={trainer}
            className="h-full min-w-0"
            imagePriority={index < ABOVE_FOLD_IMAGE_COUNT}
          />
        ))}
      </div>

      <CatalogPagination
        query={result.appliedQuery}
        page={result.pagination.page}
        totalPages={result.pagination.totalPages}
      />
    </div>
  );
}
