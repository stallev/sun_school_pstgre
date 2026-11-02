import { ContentText } from "@/components/atoms/ContentText";
import type { SuggestionVerseView } from "@/lib/achievements/pupil-achievement-panel-types";

type SuggestionVerseListProps = {
  verses: SuggestionVerseView[];
  emptyLabel: string;
  textMissingLabel: string;
  className?: string;
};

/** Verses of a suggestion series: lesson date, reference and text in the group translation. */
export const SuggestionVerseList = ({
  verses,
  emptyLabel,
  textMissingLabel,
  className,
}: SuggestionVerseListProps) => {
  if (verses.length === 0) {
    return (
      <ContentText tone="muted" className={className}>
        {emptyLabel}
      </ContentText>
    );
  }
  return (
    <ul className={`divide-y divide-line ${className ?? ""}`}>
      {verses.map((verse) => (
        <li key={verse.reference} className="space-y-0.5 py-2.5">
          <ContentText className="font-medium">
            {verse.reference}
            {verse.dateLabel ? (
              <span className="font-normal text-muted"> · {verse.dateLabel}</span>
            ) : null}
          </ContentText>
          <ContentText tone={verse.text ? "secondary" : "muted"} className="font-display">
            {verse.text ?? textMissingLabel}
          </ContentText>
        </li>
      ))}
    </ul>
  );
};
