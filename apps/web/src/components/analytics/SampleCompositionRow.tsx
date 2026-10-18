import { ContentText } from "@/components/atoms/ContentText";
import type { GroupAnalyticsSnapshot } from "@/data/analytics/analytics-compute.server";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

type SampleCompositionRowProps = {
  snapshot: GroupAnalyticsSnapshot;
  messages: AnalyticsMessages;
};

export const SampleCompositionRow = ({ snapshot, messages }: SampleCompositionRowProps) => {
  const { A, B, C, D } = snapshot.sampleCounts;
  return (
    <ContentText className="text-sm text-ink-2">
      {messages.sampleComposition(A, B, C, D)}
    </ContentText>
  );
};
