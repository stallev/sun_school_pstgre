"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import {
  LESSON_KIND,
  MUTATION_ERROR_CODES,
  type LessonKind,
  type MutationResult,
} from "@sunschool/domain";
import { createLessonAction, updateLessonAction } from "@/actions/lessons";
import { AlertText, ContentText, SectionTitle } from "@/components/atoms";
import { Banner } from "@/components/patterns/Banner";
import { CustomLink } from "@/components/ui/custom-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TermLabel, nonEmptyTerm } from "@/components/ui/term-label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { LessonFormPageData } from "@/data/lessons/load-lesson-form-page.server";
import type { LessonFormVerseRow } from "@/data/lessons/load-lesson-form-page.server";
import { formatVerseRefLabel } from "@/lib/lesson/format-verse-ref";
import type { TeacherLessonFormMessages } from "@/lib/messages/teacher-lesson-messages";
import type { HintTerm } from "@/lib/messages/pick-hints-messages";
import { fillMessage } from "@/lib/messages/fill-message";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { resolveMessageKey } from "@/lib/messages/resolve-message-key";
import { FormDateField } from "@/components/ui/form-date-field";
import { FormSelect } from "@/components/ui/form-select";
import type { MessageLocale } from "@/lib/messages/dictionary-types";
import { getFormDateFieldCopy } from "@/lib/i18n/get-form-date-field-copy";
import { VersePicker } from "@/components/teacher/VersePicker";
import { VerseRefList } from "@/components/teacher/VerseRefList";
import { useLessonFormSubmit } from "@/components/teacher/use-lesson-form-submit";

type LessonFormProps = {
  data: Extract<LessonFormPageData, { kind: "form" }>;
  messages: TeacherLessonFormMessages;
  translationLabel: string;
  dictionaries: Record<string, Dictionary>;
  uiLocale: MessageLocale;
  formError: string;
  cancelHref: string;
  formHints: { lessonType: HintTerm; lessonLeader: HintTerm };
  termHintAriaLabel: string;
};

const fieldOrder = ["gradeId", "lessonDate", "title", "leadTeacherId", "verses"] as const;

export const LessonForm = ({
  data,
  messages,
  translationLabel,
  dictionaries,
  uiLocale,
  formError,
  cancelHref,
  formHints,
  termHintAriaLabel,
}: LessonFormProps) => {
  const dateFieldCopy = getFormDateFieldCopy(dictionaries.common!, uiLocale);
  const router = useRouter();
  const formId = useId();
  const [createState, createFormAction, createPending] = useActionState<
    MutationResult<{ lessonId: string }> | null,
    FormData
  >(createLessonAction, null);
  const [updateState, updateFormAction, updatePending] = useActionState<MutationResult | null, FormData>(
    updateLessonAction,
    null,
  );
  const state = data.mode === "create" ? createState : updateState;
  const formAction = data.mode === "create" ? createFormAction : updateFormAction;
  const pending = data.mode === "create" ? createPending : updatePending;
  const [title, setTitle] = useState(data.values.title);
  const [lessonDate, setLessonDate] = useState(data.values.lessonDate);
  const [kind, setKind] = useState<LessonKind>(data.values.kind);
  const [leadTeacherId, setLeadTeacherId] = useState(data.values.leadTeacherId);
  const [body, setBody] = useState(data.values.body);
  const [hasTest, setHasTest] = useState(data.values.hasTest);
  const [gradeId, setGradeId] = useState(data.gradeId);
  const [verses, setVerses] = useState<LessonFormVerseRow[]>(data.values.verses);
  const titleRef = useRef<HTMLInputElement>(null);

  useLessonFormSubmit({
    state,
    mode: data.mode,
    dictionaries,
    formError,
    toastCreated: messages.toastCreated,
    toastUpdated: messages.toastUpdated,
    lessonId: data.lessonId,
  });

  useEffect(() => {
    if (!state || state.ok || !state.fields) return;
    const firstKey = fieldOrder.find((key) => state.fields?.[key]);
    if (firstKey === "title") titleRef.current?.focus();
  }, [state]);

  const fieldError = (name: string): string | undefined => {
    if (!state || state.ok || !state.fields?.[name]) return undefined;
    return resolveMessageKey(dictionaries, state.fields[name]);
  };

  const hasMissingVerses =
    verses.some((row) => row.hasMissing) ||
    Boolean(state && !state.ok && state.code === MUTATION_ERROR_CODES.CHECK_VERSE_MISSING);

  const isReview = kind === LESSON_KIND.REVIEW;
  const busy = pending || !data.canMutate;
  const submitDisabled = busy || hasMissingVerses;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("versesJson", JSON.stringify(isReview ? [] : verses));
    formData.set("hasTest", isReview ? "false" : String(hasTest));
    formData.set("kind", kind);
    formAction(formData);
  };

  const handleKindChange = (next: LessonKind) => {
    setKind(next);
    if (next === LESSON_KIND.REVIEW) {
      setHasTest(false);
      setVerses([]);
    }
  };

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className="grid w-full grid-cols-1 gap-stack lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start"
      aria-busy={busy}
    >
      {data.lessonId ? <input type="hidden" name="lessonId" value={data.lessonId} /> : null}
      <input type="hidden" name="gradeId" value={gradeId} />
      <input type="hidden" name="kind" value={kind} />
      <section className="flex min-w-0 flex-col gap-stack rounded-xl border border-line bg-surface p-card">
        {data.grades.length > 1 ? (
          <label className="grid w-full gap-label text-sm">
            <span>{messages.gradeLabel}</span>
            <FormSelect
              value={gradeId}
              placeholder={messages.gradePlaceholder}
              disabled={busy || data.mode === "edit"}
              options={data.grades.map((grade) => ({ value: grade.gradeId, label: grade.name }))}
              onValueChange={(next) => {
                if (data.mode === "create") {
                  router.push(`/lessons/new?gradeId=${encodeURIComponent(next)}`);
                  return;
                }
                setGradeId(next);
              }}
            />
          </label>
        ) : null}
        <div className="grid grid-cols-1 gap-stack sm:grid-cols-[minmax(0,1fr)_8rem]">
          <label className="grid w-full gap-label text-sm" htmlFor={`${formId}-date`}>
            <span>{messages.dateLabel}</span>
            <FormDateField
              id={`${formId}-date`}
              name="lessonDate"
              min={data.yearStartIso}
              max={data.yearEndIso}
              value={lessonDate}
              onValueChange={setLessonDate}
              disabled={busy || data.checksLockedFields}
              invalid={Boolean(fieldError("lessonDate"))}
              locale={dateFieldCopy.locale}
              calendarAriaLabel={dateFieldCopy.calendarAriaLabel}
              className="max-w-none"
            />
            <div className="min-h-5">
              {fieldError("lessonDate") ? <AlertText>{fieldError("lessonDate")}</AlertText> : null}
            </div>
          </label>
          {data.ordinal ? (
            <div className="grid content-start gap-label">
              <p className="text-sm font-medium">{messages.ordinalLabel}</p>
              <p className="flex h-9 items-center rounded-lg bg-paper px-stack tabular-nums text-ink-2">{data.ordinal}</p>
            </div>
          ) : null}
        </div>
        <div className="grid gap-label">
          <p className="text-sm font-medium">
            <TermLabel
              term={nonEmptyTerm(formHints.lessonType.term)}
              hint={formHints.lessonType.hint}
              ariaLabel={fillMessage(termHintAriaLabel, { term: formHints.lessonType.term })}
            />
          </p>
          {data.kindLocked ? (
            <p className="flex h-9 items-center rounded-lg bg-paper px-stack text-sm text-ink-2">
              {messages.kindLockedHint}
            </p>
          ) : (
            <SegmentedControl
              aria-label={messages.kindLabel}
              value={kind}
              disabled={busy}
              options={[
                { value: LESSON_KIND.REGULAR, label: messages.kindRegular },
                { value: LESSON_KIND.REVIEW, label: messages.kindReview },
              ]}
              onValueChange={handleKindChange}
            />
          )}
          <ContentText className="text-sm text-ink-2">
            {isReview ? messages.kindReviewHint : messages.kindRegularHint}
          </ContentText>
        </div>
        <label className="grid w-full gap-label text-sm" htmlFor={`${formId}-title`}>
          <span>{messages.titleLabel}</span>
          <Input
            ref={titleRef}
            id={`${formId}-title`}
            name="title"
            value={title}
            placeholder={messages.titlePlaceholder}
            disabled={busy}
            aria-invalid={Boolean(fieldError("title"))}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="min-h-5">
            {fieldError("title") ? <AlertText>{fieldError("title")}</AlertText> : null}
          </div>
        </label>
        <label className="grid w-full gap-label text-sm" htmlFor={`${formId}-lead`}>
          <span>
            <TermLabel
              term={nonEmptyTerm(formHints.lessonLeader.term)}
              hint={formHints.lessonLeader.hint}
              ariaLabel={fillMessage(termHintAriaLabel, { term: formHints.lessonLeader.term })}
            />
          </span>
          <FormSelect
            id={`${formId}-lead`}
            name="leadTeacherId"
            value={leadTeacherId}
            placeholder={messages.leadPlaceholder}
            disabled={busy}
            invalid={Boolean(fieldError("leadTeacherId"))}
            options={data.teachers.map((teacher) => ({
              value: teacher.userId,
              label: `${teacher.displayName}${teacher.isSelf ? messages.leadYouSuffix : ""}`,
            }))}
            onValueChange={setLeadTeacherId}
          />
          <ContentText className="text-sm text-muted">{messages.leadHint}</ContentText>
          <div className="min-h-5">
            {fieldError("leadTeacherId") ? <AlertText>{fieldError("leadTeacherId")}</AlertText> : null}
          </div>
        </label>
        <label className="grid w-full gap-label text-sm" htmlFor={`${formId}-body`}>
          <span>
            {messages.bodyLabel}{" "}
            <span className="font-normal text-muted">{messages.bodyOptional}</span>
          </span>
          <Textarea
            id={`${formId}-body`}
            name="body"
            rows={5}
            value={body}
            placeholder={messages.bodyPlaceholder}
            disabled={busy}
            onChange={(e) => setBody(e.target.value)}
          />
        </label>
        {!isReview ? (
          <label className="flex items-center gap-chip">
            <Switch
              checked={hasTest}
              disabled={busy || data.checksLockedFields}
              onCheckedChange={setHasTest}
            />
            <span>{messages.hasTestLabel}</span>
          </label>
        ) : null}
      </section>

      {isReview ? (
        <section className="flex min-w-0 flex-col gap-stack rounded-xl border border-line bg-surface p-card">
          <SectionTitle>{messages.reviewPanelTitle}</SectionTitle>
          <ul className="flex flex-col gap-chip text-sm text-ink-2">
            {messages.reviewPanelBullets.map((line) => (
              <li key={line}>— {line}</li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="flex min-w-0 flex-col gap-stack rounded-xl border border-line bg-surface p-card">
          <SectionTitle>{messages.versesTitle}</SectionTitle>
          <ContentText className="text-sm text-ink-2">
            {fillMessage(messages.versesHint, {
              max: data.maxVersesPerLesson,
              translation: translationLabel,
            })}
          </ContentText>
          <div id={`${formId}-verses`}>
            <VerseRefList
              verses={verses}
              books={data.books}
              messages={messages}
              disabled={busy || data.checksLockedFields}
              onRemove={(index) => setVerses((prev) => prev.filter((_, i) => i !== index))}
            />
          </div>
          {fieldError("verses") ? <AlertText>{fieldError("verses")}</AlertText> : null}
          {hasMissingVerses ? (
            <Banner tone="warning" title={messages.missingVersesTitle}>
              <ul className="list-disc pl-card">
                {verses
                  .filter((row) => row.hasMissing)
                  .map((row) => {
                    const book = data.books.find((b) => b.id === row.bookId);
                    const ref = book ? formatVerseRefLabel(book, messages.locale, row) : "";
                    return <li key={ref}>{fillMessage(messages.missingVerseItem, { ref })}</li>;
                  })}
              </ul>
            </Banner>
          ) : null}
          {!data.checksLockedFields ? (
            <VersePicker
              gradeId={gradeId}
              books={data.books}
              messages={messages}
              maxVerses={data.maxVersesPerLesson}
              currentCount={verses.length}
              disabled={busy}
              onAdd={(verse) => setVerses((prev) => [...prev, verse])}
            />
          ) : null}
        </section>
      )}

      <div className="flex flex-col-reverse gap-chip sm:flex-row lg:col-span-2">
        <Button type="button" variant="ghost" className="min-h-11" render={<CustomLink href={cancelHref} />}>
          {messages.cancel}
        </Button>
        <Button type="submit" className="min-h-11 sm:min-w-48" disabled={submitDisabled} aria-busy={pending ?? undefined}>
          {pending ? <Loader2Icon className="size-4 animate-spin" aria-hidden /> : null}
          {pending
            ? messages.saving
            : data.mode === "create"
              ? messages.saveCreate
              : messages.saveUpdate}
        </Button>
      </div>
    </form>
  );
};
