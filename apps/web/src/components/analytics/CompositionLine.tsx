import { ContentText } from "@/components/atoms/ContentText";
import type { GroupAnalyticsSnapshot } from "@/data/analytics/analytics-compute.server";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

type CompositionLineProps = {
  snapshot: GroupAnalyticsSnapshot;
  messages: AnalyticsMessages;
};

export const CompositionLine = ({ snapshot, messages }: CompositionLineProps) => {
  const { A, B, C, D } = snapshot.sampleCounts;
  return (
    <ContentText className="mt-2 mb-6 text-sm text-ink-2">
      {messages.sampleCompositionLead}{" "}
      <span className="font-bold text-ink">{messages.sampleLayerRegularly}</span>{" "}
      <span className="font-bold tabular-nums text-ink">{A}</span>
      {" · "}
      <span className="font-bold text-ink">{messages.sampleLayerRarely}</span>{" "}
      <span className="font-bold tabular-nums text-ink">{B}</span>
      {" · "}
      <span className="font-bold text-ink">{messages.sampleLayerInactive}</span>{" "}
      <span className="font-bold tabular-nums text-ink">{C}</span>
      {" · "}
      <span className="font-bold text-ink">{messages.sampleLayerNoChecks}</span>{" "}
      <span className="font-bold tabular-nums text-ink">{D}</span>
    </ContentText>
  );
};
