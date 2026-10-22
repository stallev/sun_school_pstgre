import { Suspense } from "react";
import { AchievementsPageContent } from "@/components/achievements/AchievementsPageContent.server";
import { PagePendingSkeleton } from "@/components/patterns/PagePendingSkeleton";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

const AchievementsPage = async () => {
  const locale = await getUiLocale();
  const commonDict = await getDictionary(locale, "common");
  const pendingLabel = getMessage(commonDict, "states.page_loading");

  return (
    <Suspense fallback={<PagePendingSkeleton pendingLabel={pendingLabel} />}>
      <AchievementsPageContent />
    </Suspense>
  );
};

export default AchievementsPage;
