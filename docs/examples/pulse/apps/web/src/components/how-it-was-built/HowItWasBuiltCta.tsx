import { ArrowRightIcon } from "lucide-react";

import { ContentText, Heading } from "@/components/atoms";
import { Container } from "@/components/ui/container";
import { CustomLink } from "@/components/ui/CustomLink";
import { getMessages } from "@/lib/messages/server";

export async function HowItWasBuiltCta() {
  const messages = await getMessages();
  const cta = messages.howItWasBuilt.cta;

  return (
    <section className="border-t border-border bg-muted/40 py-14 md:py-16">
      <Container variant="marketing" className="text-center">
        <Heading as="h2" visualLevel="h1" className="mb-3 text-2xl md:text-3xl">
          {cta.title}
        </Heading>
        <ContentText variant="lead" as="p" className="mx-auto mb-8 max-w-xl">
          {cta.description}
        </ContentText>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <CustomLink as="button" href="/trainers" size="lg" className="rounded-full px-8">
            {cta.primary}
            <ArrowRightIcon aria-hidden className="size-[18px]" />
          </CustomLink>
          <CustomLink
            as="button"
            href="/auth/login"
            variant="outline"
            size="lg"
            className="rounded-full px-8"
          >
            {cta.secondary}
          </CustomLink>
        </div>
      </Container>
    </section>
  );
}
