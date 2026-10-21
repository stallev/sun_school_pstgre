import { Suspense } from "react";
import { AnalyticsPageContent } from "@/components/analytics/AnalyticsPageContent.server";
import { AnalyticsPageSkeleton } from "@/components/analytics/AnalyticsPageSkeleton";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

type AnalyticsPageProps = {
  searchParams: Promise<{
    gradeId?: string;
    year?: string;
    mode?: string;
    month?: string;
    from?: string;
    to?: string;
  }>;
};

const AnalyticsPage = async ({ searchParams }: AnalyticsPageProps) => {
  const locale = await getUiLocale();
  const commonDict = await getDictionary(locale, "common");
  const pendingLabel = getMessage(commonDict, "states.page_loading");

  return (
    <Suspense fallback={<AnalyticsPageSkeleton pendingLabel={pendingLabel} />}>
      <AnalyticsPageContent searchParams={searchParams} />
    </Suspense>
  );
};

export default AnalyticsPage;
