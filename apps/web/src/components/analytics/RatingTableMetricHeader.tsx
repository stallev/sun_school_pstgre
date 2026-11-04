import { TermHint } from "@/components/ui/term-hint";
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
  <span className="inline-flex items-center justify-end gap-1">
    {label}
    <TermHint
      term={term}
      hint={hint}
      ariaLabel={fillMessage(termHintAriaLabel, { term })}
    />
  </span>
);
