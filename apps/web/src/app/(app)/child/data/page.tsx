import { Suspense } from "react";
import {
  ParentChildDataPageContent,
  type ParentChildDataPageProps,
} from "@/components/parent/ParentChildDataPageContent.server";
import { PagePendingSkeleton } from "@/components/patterns/PagePendingSkeleton";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

const ChildDataPage = async (props: ParentChildDataPageProps) => {
  const locale = await getUiLocale();
  const commonDict = await getDictionary(locale, "common");
  const pendingLabel = getMessage(commonDict, "states.page_loading");

  return (
    <Suspense fallback={<PagePendingSkeleton pendingLabel={pendingLabel} />}>
      <ParentChildDataPageContent {...props} />
    </Suspense>
  );
};

export default ChildDataPage;
