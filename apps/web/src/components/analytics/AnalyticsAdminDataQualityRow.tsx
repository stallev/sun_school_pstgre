import { AlertTriangleIcon } from "lucide-react";
import { ContentText } from "@/components/atoms/ContentText";
import { fillMessage } from "@/lib/messages/fill-message";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

type AnalyticsAdminDataQualityRowProps = {
  missingRecords: number;
  migrationDuplicates: number;
  messages: AnalyticsMessages;
};

export const AnalyticsAdminDataQualityRow = ({
  missingRecords,
  migrationDuplicates,
  messages,
}: AnalyticsAdminDataQualityRowProps) => (
  <ContentText className="flex items-start gap-2 text-sm text-ink-2">
    <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
    {fillMessage(messages.dataQuality.adminSummary, {
      missing: missingRecords,
      duplicates: migrationDuplicates,
    })}
  </ContentText>
);
