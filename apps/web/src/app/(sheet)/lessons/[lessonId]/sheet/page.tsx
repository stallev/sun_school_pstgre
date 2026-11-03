import type { Metadata } from "next";
import { Suspense } from "react";
import { LessonSheetContent } from "@/components/teacher/LessonSheetContent.server";
import { PagePendingSkeleton } from "@/components/patterns/PagePendingSkeleton";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

type LessonSheetPageProps = {
  params: Promise<{ lessonId: string }>;
};

export const generateMetadata = async (): Promise<Metadata> => {
  const locale = await getUiLocale();
  const teacher = await getDictionary(locale, "teacher");
  return { title: getMessage(teacher, "check.sheet_open") };
};

const LessonSheetPage = async ({ params }: LessonSheetPageProps) => {
  const locale = await getUiLocale();
  const commonDict = await getDictionary(locale, "common");
  const pendingLabel = getMessage(commonDict, "states.page_loading");

  return (
    <Suspense fallback={<PagePendingSkeleton pendingLabel={pendingLabel} />}>
      <LessonSheetContent params={params} />
    </Suspense>
  );
};

export default LessonSheetPage;
