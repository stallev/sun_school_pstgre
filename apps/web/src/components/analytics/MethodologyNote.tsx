import { SectionTitle } from "@/components/atoms/SectionTitle";
import { ContentText } from "@/components/atoms/ContentText";
import { Card } from "@/components/ui/card";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

type MethodologyNoteProps = {
  messages: AnalyticsMessages;
};

export const MethodologyNote = ({ messages }: MethodologyNoteProps) => (
  <Card className="space-y-2 p-4">
    <SectionTitle as="h2">{messages.methodology.title}</SectionTitle>
    <ContentText className="text-sm text-ink-2">{messages.methodology.body}</ContentText>
  </Card>
);
