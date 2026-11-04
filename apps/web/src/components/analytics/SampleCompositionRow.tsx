import type { GroupAnalyticsSnapshot } from "@/data/analytics/analytics-compute.server";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";
import { CompositionLine } from "./CompositionLine";

type SampleCompositionRowProps = {
  snapshot: GroupAnalyticsSnapshot;
  messages: AnalyticsMessages;
};

export const SampleCompositionRow = (props: SampleCompositionRowProps) => (
  <CompositionLine {...props} />
);

export { CompositionLine } from "./CompositionLine";
