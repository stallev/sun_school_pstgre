import { AlertTriangleIcon } from "lucide-react";
import { ContentText } from "@/components/atoms/ContentText";
import { CustomLink } from "@/components/ui/custom-link";
import { fillMessage } from "@/lib/messages/fill-message";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

type DataQualityLineProps = {
  missingRecords: number;
  migrationDuplicates: number;
  isAdmin: boolean;
  lessonsHref: string;
  messages: AnalyticsMessages;
};

export const DataQualityLine = ({
  missingRecords,
  migrationDuplicates,
  isAdmin,
  lessonsHref,
  messages,
}: DataQualityLineProps) => {
  if (missingRecords <= 0 && (!isAdmin || migrationDuplicates <= 0)) return null;

  return (
    <ContentText className="mt-3 flex flex-wrap items-start gap-x-1 gap-y-1 text-sm text-ink-2">
      <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
      {missingRecords > 0 ? (
        <>
          {fillMessage(messages.dataQuality.missingChecked, { count: missingRecords })}{" "}
          <CustomLink href={lessonsHref} className="font-medium">
            {messages.dataQuality.lessonsLinkLabel}
          </CustomLink>
        </>
      ) : null}
      {isAdmin && migrationDuplicates > 0 ? (
        <>
          {missingRecords > 0 ? " · " : null}
          {fillMessage(messages.dataQuality.migrationDuplicates, { count: migrationDuplicates })}
        </>
      ) : null}
    </ContentText>
  );
};
