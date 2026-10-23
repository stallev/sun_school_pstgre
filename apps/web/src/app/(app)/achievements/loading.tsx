import { PagePendingSkeleton } from "@/components/patterns/PagePendingSkeleton";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

const AchievementsLoading = async () => {
  const locale = await getUiLocale();
  const commonDict = await getDictionary(locale, "common");
  return <PagePendingSkeleton pendingLabel={getMessage(commonDict, "states.page_loading")} />;
};

export default AchievementsLoading;
