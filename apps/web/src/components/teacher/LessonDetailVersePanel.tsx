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
  <section className="rounded-xl border border-line bg-surface p-4 sm:p-5">
    <h2 className="mb-3 font-medium text-ink">
      {title}
      {hint ? <span className="font-normal text-muted">{hint}</span> : null}
    </h2>
    {verses.length === 0 ? (
      <ContentText tone="secondary" className="text-sm">{emptyLabel}</ContentText>
    ) : (
      <ol className="space-y-2.5">
        {verses.map((verse) => (
          <li key={verse.refLabel}>
            <ContentText className="font-medium text-ink">{verse.refLabel}</ContentText>
            {verse.hasMissing ? (
              <AlertText className="mt-1">{verseMissing}</AlertText>
            ) : (
              <p className="mt-1 font-display text-[1.0625rem] italic leading-snug text-ink-2 whitespace-pre-wrap">
                {verse.text}
              </p>
            )}
          </li>
        ))}
      </ol>
    )}
  </section>
);
