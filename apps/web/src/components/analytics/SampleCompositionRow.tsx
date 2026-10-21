import { ContentText } from "@/components/atoms/ContentText";
import type { GroupAnalyticsSnapshot } from "@/data/analytics/analytics-compute.server";
import { fillMessage } from "@/lib/messages/fill-message";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

type SampleCompositionRowProps = {
  snapshot: GroupAnalyticsSnapshot;
  messages: AnalyticsMessages;
};

export const SampleCompositionRow = ({ snapshot, messages }: SampleCompositionRowProps) => {
  const { A, B, C, D } = snapshot.sampleCounts;
  return (
    <ContentText className="mt-2 mb-6 text-sm text-ink-2">
      {fillMessage(messages.sampleComposition, { a: A, b: B, c: C, d: D })}
    </ContentText>
  );
};
