import { connection } from "next/server";

import { ContentText } from "@/components/atoms";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher.client";
import { Container } from "@/components/ui/container";
import { CustomLink } from "@/components/ui/CustomLink";
import { PulseLogo } from "@/components/ui/PulseLogo";
import { getMessages } from "@/lib/messages/server";


export async function LandingFooter() {
  const messages = await getMessages();
  await connection();
  const { footer } = messages.landing;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted py-11">
      <Container
        variant="marketing"
        className="flex flex-col items-center justify-between gap-6 md:flex-row"
      >
        <div className="text-center md:text-left">
          <PulseLogo
            href="/"
            className="text-xl"
            homeAriaLabel={messages.site.logoHomeAriaLabel}
          />
          <ContentText variant="muted" as="p" className="mt-1">
            {footer.subtitle}
          </ContentText>
        </div>
        <nav
          aria-label={footer.navLabel}
          className="flex flex-wrap justify-center gap-7"
        >
          <CustomLink href="/trainers" variant="quiet">
            {footer.links.trainers}
          </CustomLink>
          <CustomLink href="/features" variant="quiet">
            {footer.links.features}
          </CustomLink>
          <CustomLink href="/how-it-was-built" variant="quiet">
            {footer.links.howItWasBuilt}
          </CustomLink>
          <CustomLink href="/auth/register/trainer" variant="quiet">
            {footer.links.forTrainers}
          </CustomLink>
          <CustomLink href="#" variant="quiet">
            {footer.links.privacy}
          </CustomLink>
          <CustomLink href="#" variant="quiet">
            {footer.links.terms}
          </CustomLink>
        </nav>
        <div className="flex flex-col items-center gap-4">
          <LocaleSwitcher variant="footer" />
          <ContentText variant="muted" as="p" className="text-center text-[12px]">
            {footer.copyright.replace("{year}", String(year))}
          </ContentText>
        </div>
      </Container>
    </footer>
  );
}
