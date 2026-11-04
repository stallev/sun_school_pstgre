import { ContentText } from "@/components/atoms/ContentText";
import { TermLabel, nonEmptyTerm } from "@/components/ui/term-label";
import type { TeacherBricksMessages } from "@/lib/messages/teacher-bricks-messages";
import type { GlossaryTerm } from "@/lib/messages/pick-glossary-messages";
import { fillMessage } from "@/lib/messages/fill-message";

type BricksPageSummaryProps = {
  totalToIssue: number;
  negativeBalanceCount: number;
  messages: TeacherBricksMessages;
  toIssueGlossary: GlossaryTerm;
  termHintAriaLabel: string;
};

export const BricksPageSummary = ({
  totalToIssue,
  negativeBalanceCount,
  messages,
  toIssueGlossary,
  termHintAriaLabel,
}: BricksPageSummaryProps) => (
  <ContentText className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-2">
    <span>{messages.summaryRule}</span>
    <span className="inline-flex flex-wrap items-center gap-1 font-medium text-ink">
      <TermLabel
        term={nonEmptyTerm(toIssueGlossary.term)}
        hint={toIssueGlossary.hint}
        ariaLabel={fillMessage(termHintAriaLabel, { term: toIssueGlossary.term })}
      />
      <span>{fillMessage(messages.summaryToIssueAmount, { total: String(totalToIssue) })}</span>
    </span>
    {negativeBalanceCount > 0 ? (
      <span className="text-danger">
        {fillMessage(messages.summaryNegative, { count: String(negativeBalanceCount) })}
      </span>
    ) : null}
  </ContentText>
);
