"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import type { MutationResult } from "@sunschool/domain";
import { deleteLessonAction } from "@/actions/lessons";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import type { TeacherLessonScreensMessages } from "@/lib/messages/teacher-lesson-screens-messages";

type LessonDeleteButtonProps = {
  lessonId: string;
  messages: TeacherLessonScreensMessages;
  dictionaries: Record<string, Dictionary>;
  formError: string;
};

export const LessonDeleteButton = ({
  lessonId,
  messages,
  dictionaries,
  formError,
}: LessonDeleteButtonProps) => {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<MutationResult | null, FormData>(
    deleteLessonAction,
    null,
  );

  useAdminFormMutation({
    state,
    dictionaries,
    successMessage: messages.toastDeleted,
    formErrorFallback: formError,
    onSuccess: () => router.push("/lessons"),
  });

  const formId = `delete-lesson-${lessonId}`;

  return (
    <form action={formAction} id={formId}>
      <input type="hidden" name="lessonId" value={lessonId} />
      <ConfirmDialog
        trigger={
          <Button type="button" variant="destructive" disabled={pending} aria-busy={pending}>
            {messages.actionDelete}
          </Button>
        }
        title={messages.deleteConfirmTitle}
        description={messages.deleteConfirmDescription}
        confirmLabel={messages.deleteConfirmAction}
        cancelLabel={messages.deleteCancel}
        pending={pending}
        onConfirm={() => {
          const form = document.getElementById(formId) as HTMLFormElement | null;
          form?.requestSubmit();
        }}
      />
    </form>
  );
};
