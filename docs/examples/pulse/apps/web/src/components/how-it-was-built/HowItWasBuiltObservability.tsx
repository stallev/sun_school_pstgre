import { ContentText } from "@/components/atoms";
import { HowItWasBuiltSection } from "@/components/how-it-was-built/HowItWasBuiltSection";
import { getMessages } from "@/lib/messages/server";

export async function HowItWasBuiltObservability() {
  const messages = await getMessages();
  const section = messages.howItWasBuilt.observability;

  return (
    <HowItWasBuiltSection id={section.id} title={section.title} intro={section.intro}>
      <dl className="mb-6 divide-y divide-border rounded-xl border border-border">
        {section.rows.map((row) => (
          <div
            key={row.label}
            className="grid gap-1 px-4 py-3 sm:grid-cols-[160px_1fr] sm:gap-4"
          >
            <dt>
              <ContentText as="span" variant="blockLabel" className="font-semibold text-foreground">
                {row.label}
              </ContentText>
            </dt>
            <dd>
              <ContentText as="span" variant="muted" className="text-sm">
                {row.value}
              </ContentText>
            </dd>
          </div>
        ))}
      </dl>
      <ul className="list-disc space-y-2 pl-5">
        {section.points.map((item) => (
          <li key={item}>
            <ContentText as="span" variant="body" className="text-sm">
              {item}
            </ContentText>
          </li>
        ))}
      </ul>
    </HowItWasBuiltSection>
  );
}
