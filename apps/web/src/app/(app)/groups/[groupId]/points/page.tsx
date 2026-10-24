import { Suspense } from "react";
import {
  AdminGroupPointsPageContent,
  type AdminGroupPointsPageProps,
} from "@/components/achievements/AdminGroupPointsPageContent.server";
import { PagePendingSkeleton } from "@/components/patterns/PagePendingSkeleton";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

const AdminGroupPointsPage = async (props: AdminGroupPointsPageProps) => {
  const locale = await getUiLocale();
  const commonDict = await getDictionary(locale, "common");
  const pendingLabel = getMessage(commonDict, "states.page_loading");

  return (
    <Suspense fallback={<PagePendingSkeleton pendingLabel={pendingLabel} />}>
      <AdminGroupPointsPageContent {...props} />
    </Suspense>
  );
};

export default AdminGroupPointsPage;
