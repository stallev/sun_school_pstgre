"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { GRADE_EVENT_TYPE, type GradeEventType, type MutationResult } from "@sunschool/domain";
import {
  createCalendarEventAction,
  deleteCalendarEventAction,
  updateCalendarEventAction,
} from "@/actions/calendar";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { CalendarEventRow } from "@/data/calendar/load-calendar-page.server";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import type { TeacherCalendarMessages } from "@/lib/messages/teacher-calendar-messages";
import { CustomLink } from "@/components/ui/custom-link";

type CalendarEventFormProps = {
  gradeId: string;
  messages: TeacherCalendarMessages;
  dictionaries: Record<string, Dictionary>;
  formError: string;
  canMutate: boolean;
  lessonsForLink: { lessonId: string; label: string }[];
  editEvent: CalendarEventRow | null;
  defaultDate: string | null;
  closeHref: string;
};

export const CalendarEventForm = ({
  gradeId,
  messages,
  dictionaries,
  formError,
  canMutate,
  lessonsForLink,
  editEvent,
  defaultDate,
  closeHref,
}: CalendarEventFormProps) => {
  const router = useRouter();
  const isEdit = Boolean(editEvent);
  const sheetOpen = Boolean(editEvent || defaultDate);
  const [createState, createAction, createPending] = useActionState<
    MutationResult<{ eventId: string }> | null,
    FormData
  >(createCalendarEventAction, null);
  const [updateState, updateAction, updatePending] = useActionState<MutationResult | null, FormData>(
    updateCalendarEventAction,
    null,
  );
  const [deleteState, deleteAction, deletePending] = useActionState<MutationResult | null, FormData>(
    deleteCalendarEventAction,
    null,
  );
  const formAction = isEdit ? updateAction : createAction;
  const pending = isEdit ? updatePending : createPending;

  useAdminFormMutation({
    state: createState,
    dictionaries,
    successMessage: messages.toastCreated,
    formErrorFallback: formError,
    onSuccess: () => router.replace(closeHref),
  });
  useAdminFormMutation({
    state: updateState,
    dictionaries,
    successMessage: messages.toastUpdated,
    formErrorFallback: formError,
    onSuccess: () => router.replace(closeHref),
  });
  useAdminFormMutation({
    state: deleteState,
    dictionaries,
    successMessage: messages.toastDeleted,
    formErrorFallback: formError,
    onSuccess: () => router.replace(closeHref),
  });

  const [type, setType] = useState<GradeEventType>(editEvent?.type ?? GRADE_EVENT_TYPE.TRIP);

  if (!canMutate) return null;

  const deleteFormId = editEvent ? `delete-event-${editEvent.eventId}` : "";

  return (
    <>
      <Sheet
        open={sheetOpen}
        onOpenChange={(next) => {
          if (!next) router.replace(closeHref);
        }}
      >
        <SheetContent side="bottom" className="max-h-[90dvh] md:side-right md:max-w-md" closeLabel={messages.cancel}>
          <SheetHeader>
            <SheetTitle>{isEdit ? messages.formEditTitle : messages.formCreateTitle}</SheetTitle>
            <SheetDescription className="sr-only">{messages.typeLabel}</SheetDescription>
          </SheetHeader>
          <form action={formAction} className="grid gap-4 px-4 pb-2" aria-busy={pending}>
            {isEdit && editEvent ? <input type="hidden" name="eventId" value={editEvent.eventId} /> : null}
            <input type="hidden" name="gradeId" value={gradeId} />
            <input type="hidden" name="type" value={type} />
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-ink">{messages.dateLabel}</span>
              <Input
                type="date"
                name="eventDate"
                required
                defaultValue={editEvent?.eventDateIso ?? defaultDate ?? ""}
                disabled={pending}
              />
            </label>
            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium text-ink">{messages.typeLabel}</legend>
              <div className="flex flex-wrap gap-2">
                {[GRADE_EVENT_TYPE.LESSON, GRADE_EVENT_TYPE.TRIP, GRADE_EVENT_TYPE.CANCELLATION].map(
                  (value) => (
                    <Button
                      key={value}
                      type="button"
                      size="sm"
                      variant={type === value ? "default" : "outline"}
                      disabled={pending}
                      onClick={() => setType(value)}
                    >
                      {value === GRADE_EVENT_TYPE.LESSON
                        ? messages.typeLesson
                        : value === GRADE_EVENT_TYPE.TRIP
                          ? messages.typeTrip
                          : messages.typeCancellation}
                    </Button>
                  ),
                )}
              </div>
            </fieldset>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-ink">{messages.titleLabel}</span>
              <Input name="title" required defaultValue={editEvent?.title ?? ""} disabled={pending} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-ink">{messages.descriptionLabel}</span>
              <Textarea name="description" rows={3} defaultValue={editEvent?.description ?? ""} disabled={pending} />
            </label>
            {type === GRADE_EVENT_TYPE.LESSON ? (
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-ink">{messages.lessonLinkLabel}</span>
                <select
                  name="lessonId"
                  defaultValue={editEvent?.lessonId ?? ""}
                  disabled={pending}
                  className="min-h-11 rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink"
                >
                  <option value="">{messages.lessonLinkNone}</option>
                  {lessonsForLink.map((lesson) => (
                    <option key={lesson.lessonId} value={lesson.lessonId}>{lesson.label}</option>
                  ))}
                </select>
              </label>
            ) : null}
            <SheetFooter className="flex-col gap-2 sm:flex-row">
              <Button type="submit" disabled={pending} aria-busy={pending}>
                {pending ? <Loader2Icon className="size-4 animate-spin" aria-hidden /> : null}
                {messages.save}
              </Button>
            </SheetFooter>
          </form>
          {isEdit && editEvent ? (
            <form action={deleteAction} id={deleteFormId} className="px-4 pb-2">
              <input type="hidden" name="eventId" value={editEvent.eventId} />
              <ConfirmDialog
                trigger={
                  <Button type="button" variant="destructive" disabled={deletePending} aria-busy={deletePending}>
                    {messages.delete}
                  </Button>
                }
                title={messages.deleteConfirmTitle}
                description={messages.deleteConfirmDescription}
                confirmLabel={messages.delete}
                cancelLabel={messages.cancel}
                pending={deletePending}
                onConfirm={() => {
                  const form = document.getElementById(deleteFormId) as HTMLFormElement | null;
                  form?.requestSubmit();
                }}
              />
            </form>
          ) : null}
          {editEvent?.lessonId ? (
            <div className="px-4 pb-4">
              <Button variant="outline" render={<CustomLink href={`/lessons/${editEvent.lessonId}`} />}>
                {messages.openLesson}
              </Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
};
