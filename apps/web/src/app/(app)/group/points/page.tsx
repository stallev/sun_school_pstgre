import { Suspense } from "react";
import {
  TeacherGroupPointsPageContent,
  type TeacherGroupPointsPageProps,
} from "@/components/achievements/TeacherGroupPointsPageContent.server";
import { PagePendingSkeleton } from "@/components/patterns/PagePendingSkeleton";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

const GroupPointsPage = async (props: TeacherGroupPointsPageProps) => {
  const locale = await getUiLocale();
  const commonDict = await getDictionary(locale, "common");
  const pendingLabel = getMessage(commonDict, "states.page_loading");

  return (
    <Suspense fallback={<PagePendingSkeleton pendingLabel={pendingLabel} />}>
      <TeacherGroupPointsPageContent {...props} />
    </Suspense>
  );
};

export default GroupPointsPage;
