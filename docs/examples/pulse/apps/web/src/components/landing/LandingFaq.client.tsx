"use client";

import { Container } from "@/components/ui/container";
import { MarketingAccordion } from "@/components/ui/MarketingAccordion.client";
import { MarketingSectionHeader } from "@/components/ui/MarketingSectionHeader";
import { useMessages } from "@/components/i18n/LocaleProvider.client";


export function LandingFaq() {
  const messages = useMessages();
  const { faq } = messages.landing;

  return (
    <section id="faq" className="bg-card py-24">
      <Container variant="marketing">
        <MarketingSectionHeader label={faq.label} title={faq.title} animate />
        <MarketingAccordion items={[...faq.items]} />
      </Container>
    </section>
  );
}
