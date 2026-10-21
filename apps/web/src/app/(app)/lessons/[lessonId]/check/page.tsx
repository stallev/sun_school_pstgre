import { Suspense } from "react";
import { PagePendingSkeleton } from "@/components/patterns/PagePendingSkeleton";
import { LessonCheckPageContent, type LessonCheckPageProps } from "@/components/teacher/LessonCheckPageContent.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

const LessonCheckPage = async (props: LessonCheckPageProps) => {
  const locale = await getUiLocale();
  const commonDict = await getDictionary(locale, "common");
  const pendingLabel = getMessage(commonDict, "states.page_loading");

  return (
    <Suspense fallback={<PagePendingSkeleton pendingLabel={pendingLabel} />}>
      <LessonCheckPageContent {...props} />
    </Suspense>
  );
};

export default LessonCheckPage;
