import type { CatalogTrainersQuery } from "@pulse/domain";

import { TrainerCard } from "@/components/catalog/TrainerCard";
import { getCatalogTrainers } from "@/data/catalog/get-catalog-trainers.server";

export type CatalogFirstTrainerCardProps = {
  query: CatalogTrainersQuery;
};

/** First catalog card outside the main grid Suspense — earlier LCP image discovery. */
export async function CatalogFirstTrainerCard({
  query,
}: CatalogFirstTrainerCardProps) {
  const result = await getCatalogTrainers(query);
  const first = result.items[0];

  if (!first) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 items-stretch gap-2.5 lg:grid-cols-2">
      <TrainerCard
        trainer={first}
        className="h-full min-w-0"
        imagePriority
      />
    </div>
  );
}
