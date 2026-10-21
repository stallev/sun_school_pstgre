"use client";

import { useActionState } from "react";
import type { MutationResult } from "@sunschool/domain";
import { createGroupAction } from "@/actions/school-groups";
import { useAdminMessages } from "@/components/admin/admin-messages-provider.client";
import { SectionTitle } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import type { Dictionary } from "@/lib/messages/get-dictionary";

type CreateGroupFormProps = {
  dictionaries: Record<string, Dictionary>;
  formError: string;
  disabled?: boolean;
};

export const CreateGroupForm = ({ dictionaries, formError, disabled }: CreateGroupFormProps) => {
  const messages = useAdminMessages();
  const [state, formAction, pending] = useActionState<MutationResult<{ gradeId: string }> | null, FormData>(
    createGroupAction,
    null,
  );

  useAdminFormMutation({
    state,
    dictionaries,
    successMessage: messages.group.toastCreated,
    formErrorFallback: formError,
  });

  const isBusy = pending || Boolean(disabled);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-line bg-surface p-4 sm:p-5"
      aria-busy={isBusy}
    >
      <SectionTitle>{messages.group.createTitle}</SectionTitle>
      <label className="grid gap-1 text-sm">
        <span>{messages.group.nameLabel}</span>
        <Input name="name" required disabled={isBusy} />
      </label>
      <Button type="submit" disabled={isBusy} aria-busy={isBusy}>
        {pending ? messages.group.submitPending : messages.group.createSubmit}
      </Button>
    </form>
  );
};
