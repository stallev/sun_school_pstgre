import { BookOpenTextIcon, ChevronDownIcon } from "lucide-react";
import { AlertText } from "@/components/atoms";
import type { LessonDetailVerseRow } from "@/data/lessons/load-lesson-verse-texts.server";

type LessonVersesAccordionProps = {
  title: string;
  verses: readonly LessonDetailVerseRow[];
  missingLabel: string;
};

/** Collapsed-by-default verse texts for the check screens (check flow spec §5.2б). */
export const LessonVersesAccordion = ({ title, verses, missingLabel }: LessonVersesAccordionProps) => {
  if (verses.length === 0) return null;

  return (
    <details className="group rounded-xl border border-line bg-surface open:sticky open:top-14 open:z-30">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl px-3 hover:bg-paper focus-visible:outline-2 focus-visible:outline-ring lg:min-h-9 [&::-webkit-details-marker]:hidden">
        <BookOpenTextIcon className="size-4 shrink-0 text-muted" aria-hidden />
        <span className="shrink-0 text-sm font-medium text-ink">{title}</span>
        <span className="min-w-0 flex-1 truncate text-sm text-ink-2">
          {verses.map((verse) => verse.refLabel).join(" · ")}
        </span>
        <ChevronDownIcon
          className="size-5 shrink-0 text-ink-2 transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none"
          aria-hidden
        />
      </summary>
      <ol className="max-h-[min(45dvh,22rem)] space-y-2 overflow-y-auto border-t border-line px-3 py-2.5">
        {verses.map((verse) => (
          <li key={verse.refLabel}>
            <span className="text-sm font-medium text-ink">{verse.refLabel}</span>
            {verse.hasMissing ? (
              <AlertText className="mt-0.5">{missingLabel}</AlertText>
            ) : (
              <p className="mt-0.5 whitespace-pre-wrap font-display text-base italic leading-snug text-ink-2">
                {verse.text}
              </p>
            )}
          </li>
        ))}
      </ol>
    </details>
  );
};
