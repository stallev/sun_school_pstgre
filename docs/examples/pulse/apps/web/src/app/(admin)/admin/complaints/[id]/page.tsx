import { Suspense } from "react";

import { ComplaintDetail } from "@/components/admin/ComplaintDetail.server";
import { ComplaintDetailSkeleton } from "@/components/admin/ComplaintDetailSkeleton";

type AdminComplaintDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default function AdminComplaintDetailPage({
  params,
}: AdminComplaintDetailPageProps) {
  return (
    <Suspense fallback={<ComplaintDetailSkeleton />}>
      <ComplaintDetail params={params} />
    </Suspense>
  );
}
