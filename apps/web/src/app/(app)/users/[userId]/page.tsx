import { Suspense } from "react";
import { PagePendingSkeleton } from "@/components/patterns/PagePendingSkeleton";
import { UserProfilePageContent, type UserProfilePageProps } from "@/components/admin/UserProfilePageContent.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

const UserProfilePage = async (props: UserProfilePageProps) => {
  const locale = await getUiLocale();
  const commonDict = await getDictionary(locale, "common");
  const pendingLabel = getMessage(commonDict, "states.page_loading");

  return (
    <Suspense fallback={<PagePendingSkeleton pendingLabel={pendingLabel} />}>
      <UserProfilePageContent {...props} />
    </Suspense>
  );
};

export default UserProfilePage;
