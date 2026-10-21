import { LESSON_KIND, LESSON_STATUS } from "@sunschool/domain";
import { PencilIcon } from "lucide-react";
import { ContentText, Heading } from "@/components/atoms";
import { Banner } from "@/components/patterns/Banner";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/custom-link";
import { Progress } from "@/components/ui/progress";
import type { LessonDetailPageData } from "@/data/lessons/load-lesson-detail-page.server";
import type { TeacherLessonScreensMessages } from "@/lib/messages/teacher-lesson-screens-messages";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { LessonDeleteButton } from "@/components/teacher/LessonDeleteButton.client";
import { LessonDetailVersePanel } from "@/components/teacher/LessonDetailVersePanel";

type LessonCardProps = {
  data: Extract<LessonDetailPageData, { kind: "detail" }>;
  messages: TeacherLessonScreensMessages;
  dictionaries: Record<string, Dictionary>;
  formError: string;
  lessonDateLabel: string;
};

export const LessonCard = ({
  data,
  messages,
  dictionaries,
  formError,
  lessonDateLabel,
}: LessonCardProps) => {
  const checkedCount = Math.min(data.checkedCount, data.totalPupils);
  const progressValue =
    data.totalPupils > 0 ? Math.round((checkedCount / data.totalPupils) * 100) : 0;
  const checkComplete = data.status === LESSON_STATUS.CHECK_COMPLETED;
  const checkActionLabel =
    checkedCount > 0 ? messages.actionContinueCheck : messages.actionStartCheck;
  const showDelete = data.canMutate && !data.hasChecks;
  const assignedHint =
    data.nextRegularOrdinal !== null
      ? messages.assignedVersesHintNext(data.nextRegularOrdinal)
      : messages.assignedVersesHintNextFallback;
  const recitingHint =
    data.previousRegularOrdinal !== null
      ? messages.recitingVersesHintPrev(data.previousRegularOrdinal)
      : null;

  return (
    <div className="space-y-3">
      {data.yearClosed ? (
        <Banner tone="warning" title={messages.yearClosedTitle}>
          <p>{messages.yearClosedDescription}</p>
        </Banner>
      ) : null}
      <article className="rounded-xl border border-line bg-surface p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <ContentText tone="secondary" className="text-sm">
              {messages.lessonMetaLine(data.ordinal, lessonDateLabel, data.leadName)}
              {data.lessonKind === LESSON_KIND.REVIEW ? (
                <span className="ml-2 rounded-md bg-paper px-1.5 py-px align-middle text-xs font-medium text-ink-2 ring-1 ring-line">
                  {messages.listReviewBadge}
                </span>
              ) : null}
            </ContentText>
            <Heading className="mt-1">{data.title}</Heading>
          </div>
          {data.canMutate ? (
            <div className="flex shrink-0 gap-1.5">
              <CustomLink
                href={`/lessons/${data.lessonId}/edit`}
                aria-label={messages.actionEdit}
                className="inline-flex size-10 items-center justify-center rounded-lg border border-line-strong text-ink-2 hover:bg-paper"
              >
                <PencilIcon className="size-4" aria-hidden />
              </CustomLink>
              {showDelete ? (
                <LessonDeleteButton
                  lessonId={data.lessonId}
                  messages={messages}
                  dictionaries={dictionaries}
                  formError={formError}
                  iconOnly
                />
              ) : null}
            </div>
          ) : null}
        </div>
        {data.body ? (
          <ContentText className="mt-3 border-t border-line pt-3 text-sm text-ink-2 whitespace-pre-wrap">
            {data.body}
          </ContentText>
        ) : null}
      </article>

      <section className="rounded-xl border border-line bg-surface p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <ContentText className="font-medium text-ink">{messages.checkSectionTitle}</ContentText>
              <ContentText className="text-sm tabular-nums text-ink-2">
                {messages.checkPartial(checkedCount, data.totalPupils)}
                {checkComplete ? ` · ${messages.checkCompleted}` : ""}
              </ContentText>
            </div>
            <Progress value={progressValue} />
          </div>
          <div className="grid shrink-0 grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <Button
              variant={checkComplete ? "outline" : "default"}
              className="min-h-11"
              render={<CustomLink href={`/lessons/${data.lessonId}/check`} />}
            >
              {checkActionLabel}
            </Button>
            <Button
              variant="outline"
              className="min-h-11"
              render={<CustomLink href={`/lessons/${data.lessonId}/table`} />}
            >
              {messages.actionSummaryTable}
            </Button>
          </div>
        </div>
      </section>

      {data.lessonKind === LESSON_KIND.REVIEW ? (
        <section className="rounded-xl border border-line bg-surface p-4 sm:p-5">
          <ContentText className="font-medium text-ink">{messages.reviewSectionTitle}</ContentText>
          <ContentText className="mt-1 text-sm text-ink-2">{messages.reviewSectionDescription}</ContentText>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <LessonDetailVersePanel
            title={messages.assignedVersesTitle}
            hint={assignedHint}
            verses={data.verses}
            emptyLabel={messages.versesEmpty}
            verseMissing={messages.verseMissing}
          />
          <LessonDetailVersePanel
            title={messages.recitingVersesTitle}
            hint={recitingHint}
            verses={data.recitingVerses}
            emptyLabel={messages.versesEmpty}
            verseMissing={messages.verseMissing}
          />
        </div>
      )}
    </div>
  );
};
