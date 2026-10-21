import { Suspense } from "react";
import { PagePendingSkeleton } from "@/components/patterns/PagePendingSkeleton";
import { LessonsPageContent, type LessonsPageProps } from "@/components/teacher/LessonsPageContent.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

const LessonsPage = async (props: LessonsPageProps) => {
  const locale = await getUiLocale();
  const commonDict = await getDictionary(locale, "common");
  const pendingLabel = getMessage(commonDict, "states.page_loading");

  return (
    <Suspense fallback={<PagePendingSkeleton pendingLabel={pendingLabel} />}>
      <LessonsPageContent {...props} />
    </Suspense>
  );
};

export default LessonsPage;
