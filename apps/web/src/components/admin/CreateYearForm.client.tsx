"use client";

import { useActionState, useState } from "react";
import type { MutationResult } from "@sunschool/domain";
import { createYearAction } from "@/actions/school-year";
import { useAdminMessages } from "@/components/admin/admin-messages-provider.client";
import { SectionTitle } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { FormDateField } from "@/components/ui/form-date-field";
import { Input } from "@/components/ui/input";
import type { MessageLocale } from "@/lib/messages/dictionary-types";
import { getFormDateFieldCopy } from "@/lib/i18n/get-form-date-field-copy";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import type { Dictionary } from "@/lib/messages/get-dictionary";

type CreateYearFormProps = {
  dictionaries: Record<string, Dictionary>;
  uiLocale: MessageLocale;
  formError: string;
};

export const CreateYearForm = ({ dictionaries, uiLocale, formError }: CreateYearFormProps) => {
  const messages = useAdminMessages();
  const [expanded, setExpanded] = useState(false);
  const dateFieldCopy = getFormDateFieldCopy(dictionaries.common!, uiLocale);
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

  if (!expanded) {
    return (
      <Button type="button" variant="outline" onClick={() => setExpanded(true)}>
        {messages.year.createNextToggle}
      </Button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-stack rounded-xl border border-line bg-surface p-card"
      aria-busy={pending}
    >
      <SectionTitle>{messages.year.createTitle}</SectionTitle>
      <div className="grid gap-stack md:grid-cols-2">
        <label className="grid gap-label text-sm">
          <span>{messages.year.nameLabel}</span>
          <Input name="name" required disabled={pending} />
        </label>
        <label className="grid gap-label text-sm">
          <span>{messages.year.startsOnLabel}</span>
          <FormDateField
            name="startsOn"
            disabled={pending}
            locale={dateFieldCopy.locale}
            calendarAriaLabel={dateFieldCopy.calendarAriaLabel}
            className="max-w-none"
          />
        </label>
        <label className="grid gap-label text-sm md:col-span-2">
          <span>{messages.year.endsOnLabel}</span>
          <FormDateField
            name="endsOn"
            disabled={pending}
            locale={dateFieldCopy.locale}
            calendarAriaLabel={dateFieldCopy.calendarAriaLabel}
            className="max-w-none"
          />
        </label>
      </div>
      <Button type="submit" className="self-start" disabled={pending} aria-busy={pending}>
        {pending ? messages.year.submitPending : messages.year.createSubmit}
      </Button>
    </form>
  );
};
