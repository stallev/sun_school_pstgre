import { PageHeader } from "@/components/patterns/PageHeader";
import { ContentText } from "@/components/atoms/ContentText";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

const TodayPage = async () => {
  const locale = await getUiLocale();
  const common = await getDictionary(locale, "common");

  return (
    <div className="space-y-6">
      <PageHeader title={getMessage(common, "shell.nav.today")} />
      <ContentText tone="secondary">Scaffold — lesson hub lands in later phases.</ContentText>
    </div>
  );
};

export default TodayPage;
