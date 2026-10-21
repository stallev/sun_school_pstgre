import { Suspense } from "react";
import { PagePendingSkeleton } from "@/components/patterns/PagePendingSkeleton";
import { GroupPageContent, type GroupPageProps } from "@/components/teacher/GroupPageContent.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

const GroupPage = async (props: GroupPageProps) => {
  const locale = await getUiLocale();
  const commonDict = await getDictionary(locale, "common");
  const pendingLabel = getMessage(commonDict, "states.page_loading");

  return (
    <Suspense fallback={<PagePendingSkeleton pendingLabel={pendingLabel} />}>
      <GroupPageContent {...props} />
    </Suspense>
  );
};

export default GroupPage;
