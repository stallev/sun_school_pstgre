import { SegmentedControlLinks } from "@/components/ui/segmented-control-links";
import type { LessonsListGradeOption } from "@/data/lessons/load-lessons-list-page.server";

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
  <SegmentedControlLinks
    aria-label={ariaLabel}
    value={gradeId}
    options={grades.map((grade) => {
      const params = new URLSearchParams({ year: yearId, gradeId: grade.gradeId, ...periodQuery });
      return {
        value: grade.gradeId,
        label: grade.name,
        href: `/analytics?${params.toString()}`,
      };
    })}
  />
);
