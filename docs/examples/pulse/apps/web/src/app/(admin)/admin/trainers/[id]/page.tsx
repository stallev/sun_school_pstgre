import { Suspense } from "react";

import { TrainerApplicationDetail } from "@/components/admin/TrainerApplicationDetail.server";
import { TrainerApplicationDetailSkeleton } from "@/components/admin/TrainerApplicationDetailSkeleton";

type AdminTrainerDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default function AdminTrainerDetailPage({
  params,
}: AdminTrainerDetailPageProps) {
  return (
    <Suspense fallback={<TrainerApplicationDetailSkeleton />}>
      <TrainerApplicationDetail params={params} />
    </Suspense>
  );
}
