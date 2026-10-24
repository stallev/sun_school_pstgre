import { connection } from "next/server";
import { Suspense } from "react";
import { USER_ROLE } from "@sunschool/domain";
import { SchoolAnalyticsRegions } from "@/components/analytics/SchoolAnalyticsRegions.server";
import { PageSection } from "@/components/ui/page-section";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/lib/auth/require-user";

export type SchoolPageProps = {
  searchParams: Promise<{
    gradeId?: string;
    year?: string;
    mode?: string;
    month?: string;
    from?: string;
    to?: string;
  }>;
};

const SchoolRegionsFallback = () => (
  <div className="space-y-6" aria-busy="true">
    <Skeleton className="h-9 w-48" />
    <Skeleton className="h-4 w-full max-w-md" />
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-11 w-28 rounded-lg" />
      ))}
    </div>
    <Skeleton className="h-48 w-full rounded-xl" />
    <Skeleton className="h-64 w-full rounded-xl" />
  </div>
);

export const SchoolPageContent = async ({ searchParams }: SchoolPageProps) => {
  await connection();
  const params = await searchParams;
  await requireRole(USER_ROLE.ADMIN);

  return (
    <PageSection width="full" className="min-w-0 space-y-8 overflow-x-hidden">
      <Suspense fallback={<SchoolRegionsFallback />}>
        <SchoolAnalyticsRegions searchParams={params} />
      </Suspense>
    </PageSection>
  );
};
