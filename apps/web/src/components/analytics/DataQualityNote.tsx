import { Banner } from "@/components/patterns/Banner";
import { fillMessage } from "@/lib/messages/fill-message";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

type DataQualityNoteProps = {
  missingRecords: number;
  messages: AnalyticsMessages;
};

export const DataQualityNote = ({ missingRecords, messages }: DataQualityNoteProps) => (
  <Banner tone="warning" title={messages.dataQuality.title}>
    {fillMessage(messages.dataQuality.missingRecords, { count: missingRecords })}
  </Banner>
);
