"use client";

import { useActionState } from "react";
import type { MutationResult } from "@sunschool/domain";
import { createPupilAction, updatePupilAction } from "@/actions/school-pupils";
import { useAdminMessages } from "@/components/admin/admin-messages-provider.client";
import { SectionTitle } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import type { Dictionary } from "@/lib/messages/get-dictionary";

type PupilCardFormProps = {
  dictionaries: Record<string, Dictionary>;
  formError: string;
  mode: "create" | "edit";
  pupilId?: string;
  initial?: {
    lastName: string;
    firstName: string;
    middleName: string;
    birthDate: string;
    isActive: boolean;
  };
  onSuccess?: () => void;
};

export const PupilCardForm = ({
  dictionaries,
  formError,
  mode,
  pupilId,
  initial,
  onSuccess,
}: PupilCardFormProps) => {
  const messages = useAdminMessages();
  const [createState, createFormAction, createPending] = useActionState(createPupilAction, null);
  const [updateState, updateFormAction, updatePending] = useActionState(updatePupilAction, null);
  const state: MutationResult | null = mode === "create" ? createState : updateState;
  const formAction = mode === "create" ? createFormAction : updateFormAction;
  const pending = mode === "create" ? createPending : updatePending;

  useAdminFormMutation({
    state,
    dictionaries,
    successMessage: mode === "create" ? messages.people.toastCreated : messages.people.toastUpdated,
    formErrorFallback: formError,
    onSuccess,
  });

  const isBusy = pending;

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-line bg-surface p-4" aria-busy={isBusy}>
      <SectionTitle>{mode === "create" ? messages.people.createTitle : messages.people.editTitle}</SectionTitle>
      {mode === "edit" && pupilId ? <input type="hidden" name="pupilId" value={pupilId} /> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span>{messages.form.lastName}</span>
          <Input name="lastName" required disabled={isBusy} defaultValue={initial?.lastName ?? ""} />
        </label>
        <label className="grid gap-1 text-sm">
          <span>{messages.form.firstName}</span>
          <Input name="firstName" required disabled={isBusy} defaultValue={initial?.firstName ?? ""} />
        </label>
        <label className="grid gap-1 text-sm sm:col-span-2">
          <span>{messages.form.middleName}</span>
          <Input name="middleName" disabled={isBusy} defaultValue={initial?.middleName ?? ""} />
        </label>
        <label className="grid gap-1 text-sm">
          <span>{messages.people.birthDateLabel}</span>
          <Input name="birthDate" type="date" required disabled={isBusy} defaultValue={initial?.birthDate ?? ""} />
        </label>
        {mode === "edit" ? (
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={initial?.isActive ?? true}
              disabled={isBusy}
              className="size-4 rounded border-input"
            />
            <span>{messages.people.activeLabel}</span>
          </label>
        ) : null}
      </div>
      <Button type="submit" disabled={isBusy} aria-busy={isBusy}>
        {pending ? messages.people.submitPending : mode === "create" ? messages.people.createSubmit : messages.people.saveSubmit}
      </Button>
    </form>
  );
};
