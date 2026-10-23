import { Suspense } from "react";
import {
  ParentConsentPageContent,
  type ParentConsentPageProps,
} from "@/components/parent/ParentConsentPageContent.server";
import { PagePendingSkeleton } from "@/components/patterns/PagePendingSkeleton";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

const ChildConsentPage = async (props: ParentConsentPageProps) => {
  const locale = await getUiLocale();
  const commonDict = await getDictionary(locale, "common");
  const pendingLabel = getMessage(commonDict, "states.page_loading");

  return (
    <Suspense fallback={<PagePendingSkeleton pendingLabel={pendingLabel} />}>
      <ParentConsentPageContent {...props} />
    </Suspense>
  );
};

export default ChildConsentPage;
