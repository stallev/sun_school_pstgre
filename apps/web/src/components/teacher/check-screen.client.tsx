"use client";

import { ChevronDownIcon } from "lucide-react";
import { Banner } from "@/components/patterns/Banner";
import { EmptyState } from "@/components/patterns/EmptyState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CustomLink } from "@/components/ui/custom-link";
import { CheckBottomBar } from "@/components/teacher/CheckBottomBar";
import { CheckCard } from "@/components/teacher/CheckCard";
import { CheckCardHeader } from "@/components/teacher/CheckCardHeader";
import { CheckFinishedCard } from "@/components/teacher/CheckFinishedCard";
import { CheckProgress } from "@/components/teacher/CheckProgress";
import { CheckPupilList } from "@/components/teacher/CheckPupilList";
import { useSequentialCheck } from "@/components/teacher/use-sequential-check";
import type { SequentialCheckPageData } from "@/data/checks/sequential-check-types";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import type { TeacherCheckMessages } from "@/lib/messages/teacher-check-messages";
import { fillMessage } from "@/lib/messages/fill-message";

type CheckScreenProps = {
  data: Extract<SequentialCheckPageData, { kind: "page" }>;
  initialPupilId: string | null;
  messages: TeacherCheckMessages;
  dictionaries: Record<string, Dictionary>;
};

export const CheckScreen = ({ data, initialPupilId, messages, dictionaries }: CheckScreenProps) => {
  const screen = useSequentialCheck({ data, initialPupilId, messages, dictionaries });

  if (data.pupils.length === 0) {
    return (
      <EmptyState
        title={messages.emptyRosterTitle}
        description={messages.emptyRosterDescription}
        action={
          <Button render={<CustomLink href="/group" />}>{messages.emptyRosterAction}</Button>
        }
      />
    );
  }

  if (screen.finished) {
    return (
      <CheckFinishedCard
        title={messages.finishedTitle}
        subtitle={fillMessage(messages.finishedSubtitle, {
          ordinal: data.lessonOrdinal,
          title: data.lessonTitle,
          total: data.pupils.length,
        })}
        progressLabel={fillMessage(messages.finishedProgress, {
          checked: data.pupils.length,
          total: data.pupils.length,
        })}
        linkTableLabel={messages.linkTable}
        linkBricksLabel={messages.linkBricks}
        lessonId={data.lessonId}
      />
    );
  }

  const pupil = screen.activePupil;
  if (!pupil) return null;

  const birthLabel =
    pupil.birthYear !== null
      ? fillMessage(messages.birthYear, { year: pupil.birthYear })
      : messages.birthYearUnknown;

  return (
    <div className="space-y-4 pb-24 lg:pb-6">
      <PageHeader
        title={screen.isCorrection ? messages.pageTitleCorrection : messages.pageTitleCheck}
        description={fillMessage(messages.lessonSubtitle, {
          ordinal: data.lessonOrdinal,
          title: data.lessonTitle,
        })}
        actions={
          <Button variant="outline" render={<CustomLink href={`/lessons/${data.lessonId}/table`} />}>
            {messages.linkTable}
          </Button>
        }
      />

      {data.yearClosed && !data.isAdmin ? (
        <Banner tone="warning" title={messages.yearClosedTitle}>
          <p>{messages.yearClosedDescription}</p>
        </Banner>
      ) : null}

      {screen.conflict ? (
        <Banner tone="error" title={messages.conflictTitle}>
          <Button type="button" variant="outline" onClick={() => window.location.reload()}>
            {messages.conflictReload}
          </Button>
        </Banner>
      ) : null}

      {screen.isCorrection ? (
        <Banner tone="warning" title={messages.pageTitleCorrection}>
          <p>{messages.correctionBanner}</p>
        </Banner>
      ) : (
        <CheckProgress
          checked={screen.checkedCount}
          total={data.pupils.length}
          label={fillMessage(messages.progressLabel, {
            checked: screen.checkedCount,
            total: data.pupils.length,
          })}
        />
      )}

      {screen.dirty ? (
        <p className="text-sm font-medium text-warn">{messages.unsavedIndicator}</p>
      ) : null}

      <p className="sr-only" aria-live="polite">{screen.liveMessage}</p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start">
        <details className="rounded-xl border border-line bg-surface lg:hidden">
          <summary className="flex h-11 cursor-pointer list-none items-center justify-between px-3">
            <span className="text-sm text-ink-2">
              {fillMessage(messages.pupilsToggle, {
                checked: screen.checkedCount,
                total: data.pupils.length,
              })}
            </span>
            <ChevronDownIcon className="size-5 text-ink-2" aria-hidden />
          </summary>
          <div className="border-t border-line p-1.5">
            <CheckPupilList
              pupils={screen.pupils}
              activePupilId={pupil.pupilId}
              lateLabel={messages.lateSubmitted}
              listLabel={messages.pupilsListLabel}
              onSelect={screen.moveTo}
            />
          </div>
        </details>

        <aside
          className="hidden rounded-xl border border-line bg-surface p-1.5 lg:sticky lg:top-6 lg:block"
          aria-label={messages.pupilsListLabel}
        >
          <CheckPupilList
            pupils={screen.pupils}
            activePupilId={pupil.pupilId}
            lateLabel={messages.lateSubmitted}
            listLabel={messages.pupilsListLabel}
            onSelect={screen.moveTo}
          />
        </aside>

        <Card className="px-4 pb-1 sm:px-5">
          <CheckCardHeader
            name={pupil.displayName}
            indexLabel={fillMessage(messages.pupilIndex, {
              index: screen.activeIndex + 1,
              total: data.pupils.length,
            })}
            birthLabel={birthLabel}
            points={screen.pointsPreview}
            pointsLabel={messages.pointsLabel}
            headingRef={screen.headingRef}
          />
          {screen.showForm ? (
            <>
              <CheckCard
                pupil={pupil}
                lessonKind={data.lessonKind}
                hasTest={data.hasTest}
                versesToRecite={data.versesToRecite}
                previousLessonOrdinal={data.previousLessonOrdinal}
                isCorrection={screen.isCorrection}
                reason={screen.reason}
                presentError={screen.presentError}
                disabled={screen.readOnly || screen.pending}
                messages={messages}
                onPresentChange={(value) => screen.updateActive({ presentChoice: value })}
                onSingingChange={(value) => screen.updateActive({ singing: value })}
                onVerseScoreChange={(id, value) =>
                  screen.updateActive({
                    verseScores: { ...pupil.verseScores, [id]: value },
                  })
                }
                onTestScoreChange={(value) => screen.updateActive({ testScore: value })}
                onNotebookScoreChange={(value) => screen.updateActive({ notebookScore: value })}
                onCommentChange={(value) => screen.updateActive({ comment: value })}
                onReasonChange={screen.setReason}
              />
              <CheckBottomBar
                variant="inline"
                previousLabel={messages.previousPupil}
                primaryLabel={screen.pending ? messages.pendingSave : screen.primaryLabel}
                nextLabel={messages.nextPupil}
                showNext={screen.isCorrection}
                pending={screen.pending}
                canPrevious={screen.activeIndex > 0}
                onPrevious={() => {
                  const prev = screen.pupils[screen.activeIndex - 1];
                  if (prev) screen.moveTo(prev.pupilId);
                }}
                onPrimary={screen.handleSave}
                onNext={() => {
                  const next = screen.pupils[screen.activeIndex + 1];
                  if (next) screen.moveTo(next.pupilId);
                }}
                keyboardHint={messages.keyboardHint}
              />
            </>
          ) : null}
        </Card>
      </div>

      {screen.showForm ? (
        <CheckBottomBar
          variant="fixed"
          previousLabel={messages.previousPupil}
          primaryLabel={screen.pending ? messages.pendingSave : screen.primaryLabel}
          nextLabel={messages.nextPupil}
          showNext={screen.isCorrection}
          pending={screen.pending}
          canPrevious={screen.activeIndex > 0}
          onPrevious={() => {
            const prev = screen.pupils[screen.activeIndex - 1];
            if (prev) screen.moveTo(prev.pupilId);
          }}
          onPrimary={screen.handleSave}
          onNext={() => {
            const next = screen.pupils[screen.activeIndex + 1];
            if (next) screen.moveTo(next.pupilId);
          }}
        />
      ) : null}
    </div>
  );
};
