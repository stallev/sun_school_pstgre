import { AlertTriangleIcon } from "lucide-react";
import { ContentText } from "@/components/atoms/ContentText";
import { CustomLink } from "@/components/ui/custom-link";
import { nonEmptyTerm } from "@/components/ui/non-empty-term";
import { TermLabel } from "@/components/ui/term-label";
import { fillMessage } from "@/lib/messages/fill-message";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";
import type { HintTerm } from "@/lib/messages/pick-hints-messages";

type DataQualityLineProps = {
  missingRecords: number;
  migrationDuplicates: number;
  isAdmin: boolean;
  lessonsHref: string;
  messages: AnalyticsMessages;
  recordWithoutMarkHint: HintTerm;
  termHintAriaLabel: string;
};

export const DataQualityLine = ({
  missingRecords,
  migrationDuplicates,
  isAdmin,
  lessonsHref,
  messages,
  recordWithoutMarkHint,
  termHintAriaLabel,
}: DataQualityLineProps) => {
  if (missingRecords <= 0 && (!isAdmin || migrationDuplicates <= 0)) return null;

  return (
    <ContentText className="mt-3 flex flex-wrap items-start gap-x-1 gap-y-1 text-sm text-ink-2">
      <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
      {missingRecords > 0 ? (
        <>
          <TermLabel
            term={nonEmptyTerm(recordWithoutMarkHint.term)}
            hint={recordWithoutMarkHint.hint}
            ariaLabel={fillMessage(termHintAriaLabel, { term: recordWithoutMarkHint.term })}
          />{" "}
          {fillMessage(messages.dataQuality.missingCheckedTail, { count: missingRecords })}{" "}
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
