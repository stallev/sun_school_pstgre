import { Suspense } from "react";
import { FamilyPageContent, type FamilyPageProps } from "@/components/family/FamilyPageContent.server";
import { PagePendingSkeleton } from "@/components/patterns/PagePendingSkeleton";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

const FamilyPage = async (props: FamilyPageProps) => {
  const locale = await getUiLocale();
  const commonDict = await getDictionary(locale, "common");
  const pendingLabel = getMessage(commonDict, "states.page_loading");

  return (
    <Suspense fallback={<PagePendingSkeleton pendingLabel={pendingLabel} />}>
      <FamilyPageContent {...props} />
    </Suspense>
  );
};

export default FamilyPage;
