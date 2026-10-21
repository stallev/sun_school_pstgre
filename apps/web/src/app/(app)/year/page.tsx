import { Suspense } from "react";
import { YearPageContent } from "@/components/admin/YearPageContent.server";
import { YearPageSkeleton } from "@/components/admin/YearPageSkeleton";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { pickAdminMessages } from "@/lib/messages/pick-admin-messages.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

const YearPage = async () => {
  const locale = await getUiLocale();
  const [adminDict, commonDict] = await Promise.all([
    getDictionary(locale, "admin"),
    getDictionary(locale, "common"),
  ]);
  const adminMessages = pickAdminMessages(adminDict);
  const dictionaries = { admin: adminDict, common: commonDict };
  const formError = getMessage(commonDict, "errors.form");
  const pendingLabel = getMessage(commonDict, "states.page_loading");

  return (
    <Suspense fallback={<YearPageSkeleton pendingLabel={pendingLabel} />}>
      <YearPageContent messages={adminMessages} dictionaries={dictionaries} formError={formError} />
    </Suspense>
  );
};

export default YearPage;
