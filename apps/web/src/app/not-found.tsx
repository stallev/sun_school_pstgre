import { ContentText } from "@/components/atoms/ContentText";
import { Heading } from "@/components/atoms/Heading";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

const NotFound = async () => {
  const locale = await getUiLocale();
  const common = await getDictionary(locale, "common");

  return (
    <main className="mx-auto max-w-xl p-8 text-center">
      <Heading>{getMessage(common, "states.not_found_title")}</Heading>
      <ContentText tone="secondary" className="mt-2">
        {getMessage(common, "states.not_found_description")}
      </ContentText>
    </main>
  );
};

export default NotFound;
