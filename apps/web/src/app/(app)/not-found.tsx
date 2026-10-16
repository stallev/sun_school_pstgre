import { EmptyState } from "@/components/patterns/EmptyState";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

const AppNotFound = async () => {
  const locale = await getUiLocale();
  const common = await getDictionary(locale, "common");

  return (
    <EmptyState
      title={getMessage(common, "states.not_found_title")}
      description={getMessage(common, "states.not_found_description")}
    />
  );
};

export default AppNotFound;
