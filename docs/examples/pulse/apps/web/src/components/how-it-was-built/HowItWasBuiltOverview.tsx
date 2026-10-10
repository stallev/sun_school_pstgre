import { CheckIcon } from "lucide-react";

import { ContentText } from "@/components/atoms";
import { HowItWasBuiltSection } from "@/components/how-it-was-built/HowItWasBuiltSection";
import { getMessages } from "@/lib/messages/server";

export async function HowItWasBuiltOverview() {
  const messages = await getMessages();
  const section = messages.howItWasBuilt.overview;

  return (
    <HowItWasBuiltSection id={section.id} title={section.title}>
      <div className="space-y-4">
        {section.paragraphs.map((paragraph) => (
          <ContentText key={paragraph} as="p" variant="body">
            {paragraph}
          </ContentText>
        ))}
      </div>
      <ul className="mt-6 space-y-2">
        {section.highlights.map((item) => (
          <li key={item} className="flex gap-2.5">
            <CheckIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
            <ContentText as="span" variant="body">
              {item}
            </ContentText>
          </li>
        ))}
      </ul>
    </HowItWasBuiltSection>
  );
}
