import { ArrowRightIcon } from "lucide-react";

import { ContentText } from "@/components/atoms";
import { HowItWasBuiltSection } from "@/components/how-it-was-built/HowItWasBuiltSection";
import { CustomLink } from "@/components/ui/CustomLink";
import { getMessages } from "@/lib/messages/server";

export async function HowItWasBuiltProduct() {
  const messages = await getMessages();
  const section = messages.howItWasBuilt.product;

  return (
    <HowItWasBuiltSection id={section.id} title={section.title} intro={section.intro}>
      <ul className="space-y-2">
        {section.summaries.map((item) => (
          <li key={item} className="flex gap-2.5">
            <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
            <ContentText as="span" variant="body">
              {item}
            </ContentText>
          </li>
        ))}
      </ul>
      <CustomLink
        href={section.featuresHref}
        className="mt-6 inline-flex items-center gap-1.5 font-medium text-primary"
      >
        {section.featuresLink}
        <ArrowRightIcon aria-hidden className="size-4" />
      </CustomLink>
      <ContentText as="p" variant="subtle" className="mt-4 text-sm italic">
        {section.note}
      </ContentText>
    </HowItWasBuiltSection>
  );
}
