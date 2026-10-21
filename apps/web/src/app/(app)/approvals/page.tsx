import { Suspense } from "react";
import { PagePendingSkeleton } from "@/components/patterns/PagePendingSkeleton";
import { ApprovalsPageContent } from "@/components/admin/ApprovalsPageContent.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

const ApprovalsPage = async () => {
  const locale = await getUiLocale();
  const commonDict = await getDictionary(locale, "common");
  const pendingLabel = getMessage(commonDict, "states.page_loading");

  return (
    <Suspense fallback={<PagePendingSkeleton pendingLabel={pendingLabel} />}>
      <ApprovalsPageContent />
    </Suspense>
  );
};

export default ApprovalsPage;
