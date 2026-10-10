import { ContentText } from "@/components/atoms";
import { HowItWasBuiltSection } from "@/components/how-it-was-built/HowItWasBuiltSection";
import { getMessages } from "@/lib/messages/server";

export async function HowItWasBuiltTimeline() {
  const messages = await getMessages();
  const section = messages.howItWasBuilt.timeline;

  return (
    <HowItWasBuiltSection id={section.id} title={section.title} intro={section.intro}>
      <ol className="relative space-y-0 border-l border-border pl-6">
        {section.steps.map((step, index) => (
          <li key={step.phase} className="relative pb-8 last:pb-0">
            <span
              aria-hidden
              className="absolute top-1 -left-[calc(0.75rem+1px)] size-2.5 rounded-full border-2 border-background bg-primary"
            />
            <ContentText as="p" variant="blockLabel" className="mb-1 font-semibold text-foreground">
              {step.phase}
            </ContentText>
            <ContentText as="p" variant="muted">
              {step.detail}
            </ContentText>
            {index < section.steps.length - 1 ? (
              <span aria-hidden className="sr-only">
                {" "}
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </HowItWasBuiltSection>
  );
}
