import { CustomLink } from "@/components/ui/custom-link";
import type { LessonsListGradeOption } from "@/data/lessons/load-lessons-list-page.server";
import { cn } from "@/lib/utils";

type AnalyticsGradeChipsProps = {
  grades: LessonsListGradeOption[];
  gradeId: string;
  yearId: string;
  periodQuery: Record<string, string>;
  ariaLabel: string;
};

export const AnalyticsGradeChips = ({
  grades,
  gradeId,
  yearId,
  periodQuery,
  ariaLabel,
}: AnalyticsGradeChipsProps) => (
  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={ariaLabel}>
    {grades.map((grade) => {
      const params = new URLSearchParams({ year: yearId, gradeId: grade.gradeId, ...periodQuery });
      const isSelected = grade.gradeId === gradeId;
      return (
        <CustomLink
          key={grade.gradeId}
          href={`/analytics?${params.toString()}`}
          role="radio"
          aria-checked={isSelected}
          className={cn(
            "inline-flex h-11 min-w-11 items-center rounded-lg border px-3 text-sm",
            isSelected ? "border-line-strong bg-surface font-medium text-ink" : "border-line text-ink-2",
          )}
        >
          {grade.name}
        </CustomLink>
      );
    })}
  </div>
);
