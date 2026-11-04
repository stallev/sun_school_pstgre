import { TermLabel, nonEmptyTerm } from "@/components/ui/term-label";
import { fillMessage } from "@/lib/messages/fill-message";
import type { GlossaryTerm } from "@/lib/messages/pick-glossary-messages";

type AnalyticsTableTermHeaderProps = {
  label: string;
  glossary?: GlossaryTerm;
  termHintAriaLabel: string;
  className?: string;
};

export const AnalyticsTableTermHeader = ({
  label,
  glossary,
  termHintAriaLabel,
  className,
}: AnalyticsTableTermHeaderProps) =>
  glossary ? (
    <TermLabel
      className={className ?? "inline-flex items-center justify-end gap-1"}
      term={nonEmptyTerm(label)}
      hint={glossary.hint}
      ariaLabel={fillMessage(termHintAriaLabel, { term: glossary.term })}
      popoverSide="top"
    />
  ) : (
    <span className={className}>{label}</span>
  );
