import { Suspense } from "react";
import { ParentChildPageContent, type ParentChildPageProps } from "@/components/parent/ParentChildPageContent.server";
import { PagePendingSkeleton } from "@/components/patterns/PagePendingSkeleton";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

const ChildPage = async (props: ParentChildPageProps) => {
  const locale = await getUiLocale();
  const commonDict = await getDictionary(locale, "common");
  const pendingLabel = getMessage(commonDict, "states.page_loading");

  return (
    <Suspense fallback={<PagePendingSkeleton pendingLabel={pendingLabel} />}>
      <ParentChildPageContent {...props} />
    </Suspense>
  );
};

export default ChildPage;
