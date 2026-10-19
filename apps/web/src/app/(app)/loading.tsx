import { Skeleton } from "@/components/ui/skeleton";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

const AppLoading = async () => {
  const locale = await getUiLocale();
  const common = await getDictionary(locale, "common");
  const label = getMessage(common, "states.page_loading");

  return (
    <div className="space-y-4" aria-busy="true" aria-label={label}>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full max-w-lg" />
      <Skeleton className="h-4 w-full max-w-md" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
};

export default AppLoading;
