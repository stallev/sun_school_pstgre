import { LESSON_KIND } from "@sunschool/domain";
import { AlertText, ContentText, SectionTitle } from "@/components/atoms";
import { Banner } from "@/components/patterns/Banner";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/custom-link";
import { StatusText } from "@/components/ui/status-text";
import type { LessonDetailPageData } from "@/data/lessons/load-lesson-detail-page.server";
import { formatLessonCheckProgressLabel } from "@/lib/lesson/format-lesson-check-label";
import type { TeacherLessonScreensMessages } from "@/lib/messages/teacher-lesson-screens-messages";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { LessonDeleteButton } from "@/components/teacher/LessonDeleteButton.client";

type LessonCardProps = {
  data: Extract<LessonDetailPageData, { kind: "detail" }>;
  messages: TeacherLessonScreensMessages;
  dictionaries: Record<string, Dictionary>;
  formError: string;
};

export const LessonCard = ({ data, messages, dictionaries, formError }: LessonCardProps) => {
  const kindLabel =
    data.lessonKind === LESSON_KIND.REVIEW ? messages.kindReview : messages.kindRegular;
  const checkLabel = formatLessonCheckProgressLabel(
    {
      checkedCount: data.checkedCount,
      totalPupils: data.totalPupils,
      status: data.status,
    },
    messages,
  );
  const showDelete = data.canMutate && !data.hasChecks;

  return (
    <article className="space-y-6 rounded-xl border border-line bg-surface p-4 md:p-6">
      {data.yearClosed ? (
        <Banner tone="warning" title={messages.yearClosedTitle}>
          <p>{messages.yearClosedDescription}</p>
        </Banner>
      ) : null}
      <div className="space-y-1">
        <SectionTitle>{messages.lessonCardTitle(data.ordinal, data.title)}</SectionTitle>
        <ContentText tone="secondary" className="text-sm">
          {data.lessonDateIso} · {kindLabel} · {messages.leadLabel}: {data.leadName}
        </ContentText>
      </div>
      <div className="space-y-1">
        <ContentText className="text-sm font-medium text-ink">{messages.checkProgressLabel}</ContentText>
        <StatusText tone="info">{checkLabel}</StatusText>
      </div>
      {data.lessonKind === LESSON_KIND.REGULAR ? (
        <div className="space-y-2">
          <ContentText className="text-sm font-medium text-ink">
            {data.hasTest ? messages.hasTestYes : messages.hasTestNo}
          </ContentText>
          <SectionTitle>{messages.versesTitle}</SectionTitle>
          {data.verses.length === 0 ? (
            <ContentText tone="secondary" className="text-sm">{messages.versesEmpty}</ContentText>
          ) : (
            <ul className="space-y-3">
              {data.verses.map((verse) => (
                <li key={verse.refLabel} className="space-y-1 rounded-lg border border-line bg-paper p-3">
                  <ContentText className="font-medium text-ink">{verse.refLabel}</ContentText>
                  {verse.hasMissing ? (
                    <AlertText>{messages.verseMissing}</AlertText>
                  ) : (
                    <ContentText className="text-sm whitespace-pre-wrap">{verse.text}</ContentText>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
      {data.body ? (
        <div className="space-y-2">
          <SectionTitle>{messages.bodyTitle}</SectionTitle>
          <ContentText className="whitespace-pre-wrap text-sm">{data.body}</ContentText>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button render={<CustomLink href={`/lessons/${data.lessonId}/check`} />}>
          {messages.actionCheck}
        </Button>
        {data.canMutate ? (
          <Button variant="outline" render={<CustomLink href={`/lessons/${data.lessonId}/edit`} />}>
            {messages.actionEdit}
          </Button>
        ) : null}
        {showDelete ? (
          <LessonDeleteButton
            lessonId={data.lessonId}
            messages={messages}
            dictionaries={dictionaries}
            formError={formError}
          />
        ) : null}
      </div>
    </article>
  );
};
