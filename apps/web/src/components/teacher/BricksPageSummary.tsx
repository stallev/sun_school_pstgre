import { ContentText } from "@/components/atoms/ContentText";
import type { TeacherBricksMessages } from "@/lib/messages/teacher-bricks-messages";
import { fillMessage } from "@/lib/messages/fill-message";

type BricksPageSummaryProps = {
  totalToIssue: number;
  negativeBalanceCount: number;
  messages: TeacherBricksMessages;
};

export const BricksPageSummary = ({
  totalToIssue,
  negativeBalanceCount,
  messages,
}: BricksPageSummaryProps) => (
  <ContentText className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-2">
    <span>{messages.summaryRule}</span>
    <span className="font-medium text-ink">
      {fillMessage(messages.summaryToIssue, { total: String(totalToIssue) })}
    </span>
    {negativeBalanceCount > 0 ? (
      <span className="text-danger">
        {fillMessage(messages.summaryNegative, { count: String(negativeBalanceCount) })}
      </span>
    ) : null}
  </ContentText>
);
