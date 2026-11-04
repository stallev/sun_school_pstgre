import { SectionTitle } from "@/components/atoms/SectionTitle";
import { ContentText } from "@/components/atoms/ContentText";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

type MethodologyNoteProps = {
  messages: AnalyticsMessages;
};

export const MethodologyNote = ({ messages }: MethodologyNoteProps) => (
  <details className="mt-8 max-w-3xl border-t border-line pt-6">
    <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
      <SectionTitle as="h2" className="inline">
        {messages.methodology.title}
      </SectionTitle>
    </summary>
    <ul className="mt-3 list-none space-y-2 text-ink-2">
      {messages.methodology.items.map((item) => (
        <li key={item}>
          <ContentText className="text-sm">— {item}</ContentText>
        </li>
      ))}
    </ul>
  </details>
);
