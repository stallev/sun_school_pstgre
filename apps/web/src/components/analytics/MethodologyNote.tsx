import { SectionTitle } from "@/components/atoms/SectionTitle";
import { ContentText } from "@/components/atoms/ContentText";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

type MethodologyNoteProps = {
  messages: AnalyticsMessages;
};

export const MethodologyNote = ({ messages }: MethodologyNoteProps) => (
  <section className="mt-8 max-w-3xl space-y-3 border-t border-line pt-6">
    <SectionTitle as="h2">{messages.methodology.title}</SectionTitle>
    <ul className="list-none space-y-2">
      {messages.methodology.items.map((item) => (
        <li key={item}>
          <ContentText className="text-sm text-ink-2">— {item}</ContentText>
        </li>
      ))}
    </ul>
  </section>
);
