import { AlertText, ContentText } from "@/components/atoms";
import type { LessonDetailVerseRow } from "@/data/lessons/load-lesson-detail-page.server";

type LessonDetailVersePanelProps = {
  title: string;
  hint: string | null;
  verses: LessonDetailVerseRow[];
  emptyLabel: string;
  verseMissing: string;
};

export const LessonDetailVersePanel = ({
  title,
  hint,
  verses,
  emptyLabel,
  verseMissing,
}: LessonDetailVersePanelProps) => (
  <section className="space-y-3 rounded-xl border border-line bg-surface p-4 md:p-5">
    <h2 className="font-medium text-ink">
      {title}
      {hint ? <span className="font-normal text-muted"> {hint}</span> : null}
    </h2>
    {verses.length === 0 ? (
      <ContentText tone="secondary" className="text-sm">{emptyLabel}</ContentText>
    ) : (
      <ul className="space-y-3">
        {verses.map((verse) => (
          <li key={verse.refLabel} className="space-y-1 rounded-lg border border-line bg-paper p-3">
            <ContentText className="font-medium text-ink">{verse.refLabel}</ContentText>
            {verse.hasMissing ? (
              <AlertText>{verseMissing}</AlertText>
            ) : (
              <ContentText className="whitespace-pre-wrap text-sm">{verse.text}</ContentText>
            )}
          </li>
        ))}
      </ul>
    )}
  </section>
);
