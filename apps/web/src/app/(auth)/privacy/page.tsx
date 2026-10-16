import type { Metadata } from "next";
import { ContentText, Heading, SectionTitle } from "@/components/atoms";
import { CustomLink } from "@/components/ui/custom-link";
import { readConsentTextVersionFromDb } from "@/data/access/consent-text-version.server";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { pickAuthMessages } from "@/lib/messages/auth-messages";
import { getDictionary } from "@/lib/messages/get-dictionary";
import { getPrivacyContent } from "@/app/(auth)/privacy/content";

export const instant = false;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Privacy",
};

const PrivacyPage = async () => {
  const locale = await getUiLocale();
  const auth = await getDictionary(locale, "auth");
  const authMessages = pickAuthMessages(auth);
  const content = getPrivacyContent(locale);
  const consentVersion = await readConsentTextVersionFromDb(await getPrisma());

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <Heading>{authMessages.privacy.title}</Heading>
        <ContentText tone="muted" className="text-muted-foreground">
          {authMessages.privacy.versionLabel}: {consentVersion}
        </ContentText>
      </header>

      {content.sections.map((section) => (
        <section key={section.title} className="space-y-2">
          <SectionTitle>{section.title}</SectionTitle>
          {section.body.map((paragraph) => (
            <ContentText key={paragraph}>{paragraph}</ContentText>
          ))}
        </section>
      ))}

      <CustomLink href="/login">{authMessages.privacy.backToLogin}</CustomLink>
    </main>
  );
};

export default PrivacyPage;
