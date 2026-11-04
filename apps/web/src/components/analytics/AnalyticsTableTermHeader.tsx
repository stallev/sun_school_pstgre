import { TermHint } from "@/components/ui/term-hint";
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
}: AnalyticsTableTermHeaderProps) => (
  <span className={className ?? "inline-flex items-center justify-end gap-1"}>
    {label}
    {glossary ? (
      <TermHint
        term={glossary.term}
        hint={glossary.hint}
        ariaLabel={fillMessage(termHintAriaLabel, { term: glossary.term })}
      />
    ) : null}
  </span>
);
