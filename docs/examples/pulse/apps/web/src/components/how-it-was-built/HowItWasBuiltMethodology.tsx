import { ContentText } from "@/components/atoms";
import { HowItWasBuiltSection } from "@/components/how-it-was-built/HowItWasBuiltSection";
import { getMessages } from "@/lib/messages/server";

export async function HowItWasBuiltMethodology() {
  const messages = await getMessages();
  const section = messages.howItWasBuilt.methodology;

  return (
    <HowItWasBuiltSection id={section.id} title={section.title} intro={section.intro}>
      <ol className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {section.cycle.map((step, index) => (
          <li
            key={step}
            className="rounded-xl border border-border bg-card p-4"
          >
            <ContentText
              as="span"
              variant="statusLabel"
              className="mb-2 block font-mono text-xs text-primary"
            >
              {String(index + 1).padStart(2, "0")}
            </ContentText>
            <ContentText as="p" variant="body" className="text-sm leading-relaxed">
              {step}
            </ContentText>
          </li>
        ))}
      </ol>
      <ContentText as="p" variant="muted">
        {section.closing}
      </ContentText>
    </HowItWasBuiltSection>
  );
}
