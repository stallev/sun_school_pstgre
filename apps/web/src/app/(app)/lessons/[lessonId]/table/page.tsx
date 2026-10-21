import { Suspense } from "react";
import { LessonTableContent } from "@/components/teacher/LessonTableContent.server";
import { LessonTableSkeleton } from "@/components/teacher/LessonTableSkeleton";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

type LessonTablePageProps = {
  params: Promise<{ lessonId: string }>;
};

const LessonTablePage = async ({ params }: LessonTablePageProps) => {
  const locale = await getUiLocale();
  const commonDict = await getDictionary(locale, "common");
  const pendingLabel = getMessage(commonDict, "states.page_loading");

  return (
    <Suspense fallback={<LessonTableSkeleton pendingLabel={pendingLabel} />}>
      <LessonTableContent params={params} />
    </Suspense>
  );
};

export default LessonTablePage;
