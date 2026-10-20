import { Lock } from "lucide-react";
import { ContentText } from "@/components/atoms/ContentText";
import { Icon } from "@/components/atoms/Icon";
import { Card } from "@/components/ui/card";
import type { AnalyticsYearMessages } from "@/lib/messages/analytics-messages";

type ReadOnlyYearNoteProps = {
  messages: AnalyticsYearMessages;
};

export const ReadOnlyYearNote = ({ messages }: ReadOnlyYearNoteProps) => (
  <Card className="mb-4 flex items-start gap-2 rounded-lg border border-line bg-paper px-3 py-2">
    <Icon icon={Lock} className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
    <ContentText className="text-sm text-ink-2">{messages.readonlyNote}</ContentText>
  </Card>
);
