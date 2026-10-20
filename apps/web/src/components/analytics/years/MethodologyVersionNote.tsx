import { TriangleAlert } from "lucide-react";
import { ContentText } from "@/components/atoms/ContentText";
import { Icon } from "@/components/atoms/Icon";
import { Card } from "@/components/ui/card";
import { fillMessage } from "@/lib/messages/fill-message";
import type { AnalyticsYearMessages } from "@/lib/messages/analytics-messages";

type MethodologyVersionNoteProps = {
  snapshotVersion: string;
  currentVersion: string;
  messages: AnalyticsYearMessages;
};

export const MethodologyVersionNote = ({
  snapshotVersion,
  currentVersion,
  messages,
}: MethodologyVersionNoteProps) => (
  <Card className="mb-4 flex items-start gap-2 rounded-lg border border-line bg-paper px-3 py-2">
    <Icon icon={TriangleAlert} className="mt-0.5 size-4 shrink-0 text-warn" />
    <ContentText className="text-sm text-ink-2">
      {fillMessage(messages.methodologyNote, { snapshotVersion, currentVersion })}
    </ContentText>
  </Card>
);
