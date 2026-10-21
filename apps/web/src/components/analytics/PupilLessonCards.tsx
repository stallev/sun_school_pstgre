import { CustomLink } from "@/components/ui/custom-link";
import { ContentText } from "@/components/atoms/ContentText";
import { RecordCard } from "@/components/patterns/RecordCard";
import type { PupilLessonAnalyticsRow } from "@/data/analytics/get-pupil-analytics";
import { formatAnalyticsShortDate } from "@/lib/analytics/format-analytics-display";
import { fillMessage } from "@/lib/messages/fill-message";
import type { PupilAnalyticsMessages } from "@/lib/messages/analytics-messages";

type PupilLessonCardsProps = {
  pupilId: string;
  lessons: PupilLessonAnalyticsRow[];
  messages: PupilAnalyticsMessages;
  locale: string;
  showCorrectActions?: boolean;
};

const formatVerses = (
  row: PupilLessonAnalyticsRow,
  empty: string,
  versesOf: string,
): string => {
  if (row.versesRecited === null || row.versesTotal === null) return empty;
  return fillMessage(versesOf, { recited: row.versesRecited, total: row.versesTotal });
};

const presentValue = (row: PupilLessonAnalyticsRow, messages: PupilAnalyticsMessages): string => {
  if (row.present === null) return messages.presentMissing;
  return row.present ? messages.presentYes : messages.presentNo;
};

export const PupilLessonCards = ({
  pupilId,
  lessons,
  messages,
  locale,
  showCorrectActions = false,
}: PupilLessonCardsProps) => (
  <ul className="space-y-3 lg:hidden" aria-label={messages.lessonsTitle}>
    {lessons.map((row) => (
      <RecordCard
        key={row.lessonId}
        title={
          <span className="block">
            <span className="tabular-nums">{formatAnalyticsShortDate(row.lessonDate, locale)}</span>
            <span className="mt-0.5 block font-normal">{row.title}</span>
          </span>
        }
        fields={[
          { label: messages.lessonColumnPresent, value: presentValue(row, messages) },
          {
            label: messages.lessonColumnVerses,
            value: formatVerses(row, messages.kpiEmpty, messages.versesOf),
          },
          {
            label: messages.lessonColumnTest,
            value: (
              <>
                {!row.testConducted
                  ? messages.testNotConducted
                  : row.testScore === null
                    ? messages.kpiEmpty
                    : String(row.testScore)}
                {row.submittedLate && row.testConducted ? (
                  <ContentText className="block text-sm text-muted">
                    {fillMessage(messages.submittedLate, {
                      date: formatAnalyticsShortDate(row.lessonDate, locale),
                    })}
                  </ContentText>
                ) : null}
              </>
            ),
          },
          {
            label: messages.lessonColumnNotebook,
            value: (
              <>
                {row.notebookScore === null ? messages.kpiEmpty : String(row.notebookScore)}
                {row.submittedLate ? (
                  <ContentText className="block text-sm text-muted">
                    {fillMessage(messages.submittedLate, {
                      date: formatAnalyticsShortDate(row.lessonDate, locale),
                    })}
                  </ContentText>
                ) : null}
              </>
            ),
          },
        ]}
        actions={
          showCorrectActions && row.homeworkChecked ? (
            <CustomLink
              href={`/lessons/${row.lessonId}/check?pupil=${pupilId}`}
              className="inline-flex min-h-11 items-center text-sm text-cobalt-ink hover:underline"
            >
              {messages.lessonCorrectLabel}
            </CustomLink>
          ) : undefined
        }
      />
    ))}
  </ul>
);
