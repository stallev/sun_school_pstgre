import { ArrowRightIcon } from "lucide-react";

import { ContentText } from "@/components/atoms";
import { HowItWasBuiltSection } from "@/components/how-it-was-built/HowItWasBuiltSection";
import { CustomLink } from "@/components/ui/CustomLink";
import { PulseCard } from "@/components/ui/card";
import { getMessages } from "@/lib/messages/server";

export async function FeaturesDemoPaths() {
  const messages = await getMessages();
  const section = messages.platformFeatures.demo;

  return (
    <HowItWasBuiltSection id={section.id} title={section.title} intro={section.intro}>
      <div className="grid items-stretch gap-4 md:grid-cols-3">
        {section.paths.map((path) => (
          <PulseCard key={path.title} variant="base" className="flex h-full flex-col p-5">
            <ContentText as="p" variant="blockLabel" className="mb-3 font-semibold">
              {path.title}
            </ContentText>
            <ol className="mb-4 flex-1 list-decimal space-y-1.5 pl-4">
              {path.steps.map((step) => (
                <li key={step}>
                  <ContentText as="span" variant="muted" className="text-sm">
                    {step}
                  </ContentText>
                </li>
              ))}
            </ol>
            <CustomLink
              href={path.href}
              variant="quiet"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary"
            >
              {path.linkLabel}
              <ArrowRightIcon aria-hidden className="size-3.5" />
            </CustomLink>
          </PulseCard>
        ))}
      </div>
      <ContentText as="p" variant="subtle" className="mt-5 text-sm">
        {section.credentialsNote}
      </ContentText>
    </HowItWasBuiltSection>
  );
}
