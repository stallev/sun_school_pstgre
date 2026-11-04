import { TermLabel, nonEmptyTerm } from "@/components/ui/term-label";
import { fillMessage } from "@/lib/messages/fill-message";

type RatingTableMetricHeaderProps = {
  label: string;
  term: string;
  hint: string;
  termHintAriaLabel: string;
};

export const RatingTableMetricHeader = ({
  label,
  term,
  hint,
  termHintAriaLabel,
}: RatingTableMetricHeaderProps) => (
  <TermLabel
    className="inline-flex items-center justify-end gap-1"
    term={nonEmptyTerm(label)}
    hint={hint}
    ariaLabel={fillMessage(termHintAriaLabel, { term })}
    popoverSide="top"
  />
);
