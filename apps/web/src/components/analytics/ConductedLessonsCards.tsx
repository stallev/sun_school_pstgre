import { RecordCard } from "@/components/patterns/RecordCard";
import type { ConductedLessonsSnapshot } from "@/data/analytics/get-conducted-lessons";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

type ConductedLessonsCardsProps = {
  snapshot: ConductedLessonsSnapshot;
  messages: AnalyticsMessages;
};

export const ConductedLessonsCards = ({ snapshot, messages }: ConductedLessonsCardsProps) => (
  <ul className="space-y-3 lg:hidden" aria-label={messages.conducted.tableCaption}>
    {snapshot.teachers.map((row) => (
      <RecordCard
        key={row.teacherId}
        title={row.displayName}
        note={row.noLongerAssigned ? messages.conducted.noLongerAssigned : undefined}
        fields={[
          { label: messages.conducted.columnConducted, value: row.conductedCount },
          { label: messages.conducted.columnRegular, value: row.regularCount },
          { label: messages.conducted.columnReview, value: row.reviewCount },
          { label: messages.conducted.columnPlanned, value: row.plannedCount },
          {
            label: messages.conducted.columnLessons,
            value: row.lessonOrdinals.join(", "),
            wide: true,
          },
        ]}
      />
    ))}
  </ul>
);
