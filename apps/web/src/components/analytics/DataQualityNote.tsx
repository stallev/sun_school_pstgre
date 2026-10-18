import { Banner } from "@/components/patterns/Banner";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

type DataQualityNoteProps = {
  missingRecords: number;
  messages: AnalyticsMessages;
};

export const DataQualityNote = ({ missingRecords, messages }: DataQualityNoteProps) => (
  <Banner tone="warning" title={messages.dataQuality.title}>
    {messages.dataQuality.missingRecords(missingRecords)}
  </Banner>
);
