import { PageHeader } from "@/components/patterns/PageHeader";
import { ContentText } from "@/components/atoms/ContentText";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

const SchoolPage = async () => {
  const locale = await getUiLocale();
  const common = await getDictionary(locale, "common");

  return (
    <div className="space-y-6">
      <PageHeader title={getMessage(common, "shell.nav.school")} />
      <ContentText tone="secondary">Scaffold — school dashboard lands in P02/P05.</ContentText>
    </div>
  );
};

export default SchoolPage;
