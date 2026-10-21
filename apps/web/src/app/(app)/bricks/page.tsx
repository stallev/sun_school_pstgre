import { Suspense } from "react";
import { BricksPageContent } from "@/components/teacher/BricksPageContent.server";
import { BricksPageSkeleton } from "@/components/teacher/BricksPageSkeleton";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

type BricksPageProps = {
  searchParams: Promise<{ gradeId?: string; pupilId?: string }>;
};

const BricksPage = async ({ searchParams }: BricksPageProps) => {
  const locale = await getUiLocale();
  const commonDict = await getDictionary(locale, "common");
  const pendingLabel = getMessage(commonDict, "states.page_loading");

  return (
    <Suspense fallback={<BricksPageSkeleton pendingLabel={pendingLabel} />}>
      <BricksPageContent searchParams={searchParams} />
    </Suspense>
  );
};

export default BricksPage;
