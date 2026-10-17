"use client";

import { useActionState } from "react";
import type { MutationResult } from "@sunschool/domain";
import { createYearAction } from "@/actions/school-year";
import { useAdminMessages } from "@/components/admin/admin-messages-provider.client";
import { SectionTitle } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import type { Dictionary } from "@/lib/messages/get-dictionary";

type CreateYearFormProps = {
  dictionaries: Record<string, Dictionary>;
  formError: string;
};

export const CreateYearForm = ({ dictionaries, formError }: CreateYearFormProps) => {
  const messages = useAdminMessages();
  const [state, formAction, pending] = useActionState<MutationResult<{ yearId: string }> | null, FormData>(
    createYearAction,
    null,
  );

  useAdminFormMutation({
    state,
    dictionaries,
    successMessage: messages.year.toastCreated,
    formErrorFallback: formError,
  });

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-line bg-surface p-4" aria-busy={pending}>
      <SectionTitle>{messages.year.createTitle}</SectionTitle>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span>{messages.year.nameLabel}</span>
          <Input name="name" required disabled={pending} />
        </label>
        <label className="grid gap-1 text-sm">
          <span>{messages.year.startsOnLabel}</span>
          <Input name="startsOn" type="date" required disabled={pending} />
        </label>
        <label className="grid gap-1 text-sm md:col-span-2">
          <span>{messages.year.endsOnLabel}</span>
          <Input name="endsOn" type="date" required disabled={pending} />
        </label>
      </div>
      <Button type="submit" disabled={pending} aria-busy={pending}>
        {pending ? messages.year.submitPending : messages.year.createSubmit}
      </Button>
    </form>
  );
};
