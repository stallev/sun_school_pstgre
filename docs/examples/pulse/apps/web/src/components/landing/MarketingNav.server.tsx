import { MarketingNavActions } from "@/components/landing/MarketingNavActions.client";
import { MarketingNavDesktopLinks } from "@/components/landing/MarketingNavDesktopLinks.client";
import { MarketingNavScrollFrame } from "@/components/landing/MarketingNavScrollFrame.client";
import { PulseLogo } from "@/components/ui/PulseLogo";
import { getMessages } from "@/lib/messages/server";

export async function MarketingNav() {
  const messages = await getMessages();
  const { nav } = messages.landing;

  return (
    <MarketingNavScrollFrame navAriaLabel={messages.locale.navAriaLabel}>
      <PulseLogo
        href="/"
        className="text-[20px] md:text-[22px]"
        homeAriaLabel={messages.site.logoHomeAriaLabel}
      />
      <MarketingNavDesktopLinks
        linkLabels={nav.links}
        caseStudyLabel={messages.howItWasBuilt.nav.link}
      />
      <MarketingNavActions
        linkLabels={nav.links}
        caseStudyLabel={messages.howItWasBuilt.nav.link}
        getStartedLabel={nav.getStarted}
        signInLabel={nav.signIn}
      />
    </MarketingNavScrollFrame>
  );
}
