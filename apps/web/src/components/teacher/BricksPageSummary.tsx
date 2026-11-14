import { ContentText } from "@/components/atoms/ContentText";
import { nonEmptyTerm } from "@/components/ui/non-empty-term";
import { TermLabel } from "@/components/ui/term-label";
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
    <span className="inline-flex items-center gap-chip font-medium text-ink">
      <TermLabel
        term={nonEmptyTerm(toIssueGlossary.term)}
        hint={toIssueGlossary.hint}
        ariaLabel={fillMessage(termHintAriaLabel, { term: toIssueGlossary.term })}
      />
      <span className="tabular-nums">{fillMessage(messages.summaryToIssueAmount, { total: String(totalToIssue) })}</span>
    </span>
    {negativeBalanceCount > 0 ? (
      <span className="text-danger">
        {fillMessage(messages.summaryNegative, { count: String(negativeBalanceCount) })}
      </span>
    ) : null}
  </ContentText>
);
