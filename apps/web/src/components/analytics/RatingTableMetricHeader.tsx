import { TermHint } from "@/components/ui/term-hint";

type RatingTableMetricHeaderProps = {
  label: string;
  term: string;
  hint: string;
};

export const RatingTableMetricHeader = ({ label, term, hint }: RatingTableMetricHeaderProps) => (
  <span className="inline-flex items-center justify-end gap-1">
    {label}
    <TermHint term={term} hint={hint} />
  </span>
);
