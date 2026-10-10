import { ContentText } from "@/components/atoms";
import { HowItWasBuiltSection } from "@/components/how-it-was-built/HowItWasBuiltSection";
import { getMessages } from "@/lib/messages/server";

export async function HowItWasBuiltArchitecture() {
  const messages = await getMessages();
  const section = messages.howItWasBuilt.architecture;

  return (
    <HowItWasBuiltSection id={section.id} title={section.title} intro={section.intro}>
      <div className="mb-6 overflow-x-auto rounded-2xl border border-border bg-muted/40 p-5 font-mono text-sm leading-relaxed text-foreground">
        <pre className="whitespace-pre-wrap">
{`Browser
  ↓
apps/web — Next.js 16 BFF
  ↓
@pulse/domain — business rules
@pulse/policy-server · policy-edge — authorization
@pulse/db — Prisma + Neon PostgreSQL
  ↓
AWS S3 · (post-MVP: Resend, Stripe, Daily.co)`}
        </pre>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {section.layers.map((layer) => (
          <div key={layer.name} className="rounded-xl border border-border bg-card p-4">
            <ContentText as="p" variant="blockLabel" className="mb-1 font-semibold text-primary">
              {layer.name}
            </ContentText>
            <ContentText as="p" variant="muted" className="text-sm">
              {layer.description}
            </ContentText>
          </div>
        ))}
      </div>
      <ul className="mt-6 list-disc space-y-2 pl-5">
        {section.decisions.map((item) => (
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
